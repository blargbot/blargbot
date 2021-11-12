import { ClusterUtilities } from '@cluster';
import { BBTagContextMessage, BBTagContextOptions, BBTagContextState, FindEntityOptions, FlagDefinition, FlagResult, LocatedRuntimeError, RuntimeDebugEntry, RuntimeLimit, RuntimeReturnState, SerializedBBTagContext, Statement, SubtagCall } from '@cluster/types';
import { guard, humanize, parse } from '@cluster/utils';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
import { ModuleLoader } from '@core/modules';
import { Timer } from '@core/Timer';
import { ChoiceQueryResult, EntityPickQueryOptions, NamedGuildCommandTag, StoredTag } from '@core/types';
import { Base, Client as Discord, Collection, Guild, GuildChannels, GuildMember, GuildTextBasedChannels, MessageAttachment, MessageEmbed, MessageEmbedOptions, Permissions, Role, User } from 'discord.js';
import { Duration, Moment } from 'moment-timezone';
import ReadWriteLock from 'rwlock';

import { ScopeManager } from '.';
import { BaseSubtag } from './BaseSubtag';
import { BBTagEngine } from './BBTagEngine';
import { VariableCache } from './Caching';
import { BBTagRuntimeError, UnknownSubtagError } from './errors';
import { limits } from './limits';
import { SubtagCallStack } from './SubtagCallStack';
import { TagCooldownManager } from './TagCooldownManager';

function serializeEntity(entity: { id: string; }): { id: string; serialized: string; } {
    return { id: entity.id, serialized: JSON.stringify(entity) };
}

export class BBTagContext implements Required<BBTagContextOptions> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #isStaffPromise?: Promise<boolean>;

    public readonly message: BBTagContextMessage;
    public readonly inputRaw: string;
    public readonly input: string[];
    public readonly flags: readonly FlagDefinition[];
    public readonly isCC: boolean;
    public readonly tagVars: boolean;
    public readonly author: string;
    public readonly authorizer: string;
    public readonly rootTagName: string;
    public readonly tagName: string;
    public readonly cooldown: number;
    public readonly cooldowns: TagCooldownManager;
    public readonly locks: Record<string, ReadWriteLock | undefined>;
    public readonly limit: RuntimeLimit;
    public readonly silent: boolean;
    public readonly execTimer: Timer;
    public readonly dbTimer: Timer;
    public readonly flaggedInput: FlagResult;
    public readonly errors: LocatedRuntimeError[];
    public readonly debug: RuntimeDebugEntry[];
    public readonly scopes: ScopeManager;
    public readonly variables: VariableCache;
    public dbObjectsCommitted: number;
    public readonly state: BBTagContextState;
    public readonly callStack: SubtagCallStack;

    public get totalDuration(): Duration { return this.execTimer.duration.add(this.dbTimer.duration); }
    public get channel(): GuildTextBasedChannels { return this.message.channel; }
    public get member(): GuildMember { return this.message.member; }
    public get guild(): Guild { return this.message.channel.guild; }
    public get user(): User { return this.message.author; }
    public get isStaff(): Promise<boolean> { return this.#isStaffPromise ??= this.engine.util.isUserStaff(this.authorizer, this.guild.id); }
    public get database(): Database { return this.engine.database; }
    public get logger(): Logger { return this.engine.logger; }
    public get permissions(): Permissions { return (this.guild.members.cache.get(this.authorizer) ?? { permissions: new Permissions(undefined) }).permissions; }
    public get util(): ClusterUtilities { return this.engine.util; }
    public get discord(): Discord<true> { return this.engine.discord; }
    public get subtags(): ModuleLoader<BaseSubtag> { return this.engine.subtags; }
    public get cooldownEnd(): Moment { return this.cooldowns.get(this); }

    public constructor(
        public readonly engine: BBTagEngine,
        options: BBTagContextOptions
    ) {
        this.message = options.message;
        this.inputRaw = options.inputRaw;
        this.input = humanize.smartSplit(options.inputRaw);
        this.flags = options.flags ?? [];
        this.isCC = options.isCC;
        this.tagVars = options.tagVars ?? !this.isCC;
        this.author = options.author;
        this.authorizer = options.authorizer ?? this.author;
        this.rootTagName = options.rootTagName ?? 'unknown';
        this.tagName = options.tagName ?? this.rootTagName;
        this.cooldown = options.cooldown ?? 0;
        this.cooldowns = options.cooldowns ?? new TagCooldownManager();
        this.locks = options.locks ?? {};
        this.limit = typeof options.limit === 'string' ? new limits[options.limit]() : options.limit;
        this.silent = options.silent ?? false;
        this.flaggedInput = parse.flags(this.flags, this.inputRaw);
        this.errors = [];
        this.debug = [];
        this.scopes = options.scopes ?? new ScopeManager();
        this.callStack = options.callStack ?? new SubtagCallStack();
        this.variables = options.variables ?? new VariableCache(this);
        this.execTimer = new Timer();
        this.dbTimer = new Timer();
        this.dbObjectsCommitted = 0;
        this.state = {
            query: {
                count: 0,
                user: {},
                role: {},
                channel: {}
            },
            outputMessage: undefined,
            ownedMsgs: [],
            return: RuntimeReturnState.NONE,
            stackSize: 0,
            embeds: undefined,
            file: undefined,
            reactions: [],
            nsfw: undefined,
            replace: undefined,
            break: 0,
            continue: 0,
            subtags: {},
            cache: {},
            subtagCount: 0,
            allowedMentions: {
                users: [],
                roles: [],
                everybody: false
            },
            ...options.state ?? {}
        };
    }

    public eval(bbtag: SubtagCall | Statement): Awaitable<string> {
        return this.engine.eval(bbtag, this);
    }

    public ownsMessage(messageId: string): boolean {
        return messageId === this.message.id || this.state.ownedMsgs.includes(messageId);
    }

    public getSubtag(name: string): BaseSubtag {
        let result = this.subtags.get(name);
        if (result !== undefined)
            return result;

        result = this.subtags.get(`${name.split('.', 1)[0]}.`);
        if (result !== undefined)
            return result;

        throw new UnknownSubtagError(name);
    }

    public makeChild(options: Partial<BBTagContextOptions>): BBTagContext {
        return new BBTagContext(this.engine, {
            ...this,
            ...options
        });
    }

    public addError(error: BBTagRuntimeError, subtag?: SubtagCall): string {
        this.errors.push({ subtag: subtag, error });
        return this.scopes.local.fallback ?? error.bberror;
    }

    public async queryUser(query: string, options: FindEntityOptions = {}): Promise<User | undefined> {
        const member = await this.queryMember(query, options);
        return member?.user;
    }

    public async queryMember(query: string, options: FindEntityOptions = {}): Promise<GuildMember | undefined> {
        return await this.queryEntity(
            query, 'user', 'User',
            async id => await this.util.getMember(this.guild, id),
            async query => await this.util.findMembers(this.guild, query),
            async options => await this.util.queryMember(options),
            options
        );
    }

    public async queryRole(query: string, options: FindEntityOptions = {}): Promise<Role | undefined> {
        return await this.queryEntity(
            query, 'role', 'Role',
            async id => await this.util.getRole(this.guild, id),
            async query => await this.util.findRoles(this.guild, query),
            async options => await this.util.queryRole(options),
            options
        );
    }

    public async queryChannel(query: string, options: FindEntityOptions = {}): Promise<GuildChannels | undefined> {
        return await this.queryEntity(
            query, 'channel', 'Channel',
            async id => await this.util.getChannel(this.guild, id),
            async query => await this.util.findChannels(this.guild, query),
            async options => await this.util.queryChannel(options),
            options
        );
    }

    private async queryEntity<T extends Base & { id: string; }>(
        queryString: string,
        cacheKey: FilteredKeys<BBTagContextState['query'], Record<string, string | undefined>>,
        type: string,
        fetch: (id: string) => Promise<T | undefined>,
        find: (query: string) => Promise<T[]>,
        query: (options: EntityPickQueryOptions<T>) => Promise<ChoiceQueryResult<T>>,
        options: FindEntityOptions
    ): Promise<T | undefined> {
        const cached = this.state.query[cacheKey][queryString];
        if (cached !== undefined)
            return await fetch(cached) ?? undefined;

        const noLookup = options.noLookup === true || this.scopes.local.quiet === true;
        const entities = await find(queryString);
        if (this.state.query.count >= 5 || noLookup) {
            return entities.length === 1 ? entities[0] : undefined;
        }

        const result = await query({ context: this.channel, actors: this.author, choices: entities, filter: queryString });
        const noErrors = options.noErrors === true || this.scopes.local.noLookupErrors === true;
        switch (result.state) {
            case 'FAILED':
            case 'NO_OPTIONS':
                if (!noErrors) {
                    await this.util.send(this.channel, `No ${type.toLowerCase()} matching \`${queryString}\` found in ${this.isCC ? 'custom command' : 'tag'} \`${this.rootTagName}\`.`);
                    this.state.query.count++;
                }
                return undefined;
            case 'TIMED_OUT':
            case 'CANCELLED':
                this.state.query.count = Infinity;
                if (!noErrors)
                    await this.util.send(this.channel, `${type} query canceled in ${this.isCC ? 'custom command' : 'tag'} \`${this.rootTagName}\`.`);
                return undefined;
            case 'SUCCESS':
                this.state.query[cacheKey][queryString] = result.value.id;
                return result.value;
            default:
                return result;
        }
    }

    public getLock(key: string): ReadWriteLock {
        return this.locks[key] ??= new ReadWriteLock();
    }

    private async _sendOutput(text: string): Promise<string | undefined> {
        let disableEveryone = true;
        if (this.isCC) {
            disableEveryone = await this.engine.database.guilds.getSetting(this.guild.id, 'disableeveryone') ?? false;
            disableEveryone ||= !this.state.allowedMentions.everybody;

            this.engine.logger.log('Allowed mentions:', this.state.allowedMentions, disableEveryone);
        }
        try {
            const response = await this.engine.util.send(this.message,
                {
                    content: text,
                    replyToExecuting: true,
                    embeds: this.state.embeds !== undefined ? this.state.embeds : undefined,
                    nsfw: this.state.nsfw,
                    allowedMentions: {
                        parse: disableEveryone ? [] : ['everyone'],
                        roles: this.isCC ? this.state.allowedMentions.roles : undefined,
                        users: this.isCC ? this.state.allowedMentions.users : undefined
                    },
                    files: this.state.file !== undefined ? [this.state.file] : undefined
                });

            if (response !== undefined) {
                await this.util.addReactions(response, [...new Set(this.state.reactions)]);
                this.state.ownedMsgs.push(response.id);
                return response.id;
            }
            throw new Error(`Failed to send: ${text}`);
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.message !== 'No content') {
                    throw err;
                }
                return undefined;
            }
            this.logger.error(`Failed to send: ${text}`, err);
            throw new Error(`Failed to send: ${text}`);
        }
    }

    public async sendOutput(text: string): Promise<string | undefined> {
        if (this.silent)
            return await this.state.outputMessage;
        return await (this.state.outputMessage ??= this._sendOutput(text));
    }

    public async getCached(key: `tag_${string}`, getIfNotSet: (key: string) => Promise<StoredTag | undefined>): Promise<StoredTag | null>;
    public async getCached(key: `cc_${string}`, getIfNotSet: (key: string) => Promise<NamedGuildCommandTag | undefined>): Promise<NamedGuildCommandTag | null>;
    public async getCached(key: string, getIfNotSet: (key: string) => Promise<NamedGuildCommandTag | StoredTag | undefined>): Promise<NamedGuildCommandTag | StoredTag | null> {
        key = key.split('_').slice(1).join('_');
        if (key in this.state.cache)
            return this.state.cache[key];
        const fetchedValue = await getIfNotSet(key);
        if (fetchedValue !== undefined)
            return this.state.cache[key] = fetchedValue;
        return this.state.cache[key] = null;
    }

    public static async deserialize(engine: BBTagEngine, obj: SerializedBBTagContext): Promise<BBTagContext> {
        let message: BBTagContextMessage | undefined;
        try {
            const msg = await engine.util.getMessage(obj.msg.channel.id, obj.msg.id);
            if (msg === undefined || !guard.isGuildMessage(msg))
                throw new Error('Channel must be a guild channel to work with BBTag');
            message = msg;
        } catch (err: unknown) {
            const channel = await engine.util.getChannel(obj.msg.channel.id);
            if (channel === undefined || !guard.isGuildChannel(channel))
                throw new Error('Channel must be a guild channel to work with BBTag');
            if (!guard.isTextableChannel(channel))
                throw new Error('Channel must be able to send and receive messages to work with BBTag');
            const member = await engine.util.getMember(channel.guild.id, obj.msg.member.id);
            if (member === undefined)
                throw new Error(`User ${obj.msg.member.id} doesnt exist on ${channel.guild.id} any more`);

            message = {
                id: obj.msg.id,
                createdTimestamp: obj.msg.timestamp,
                content: obj.msg.content,
                channel: channel,
                member,
                author: member.user,
                attachments: new Collection(obj.msg.attachments.map(att => [att.id, new MessageAttachment(att.url, att.name)])),
                embeds: obj.msg.embeds.map(e => new MessageEmbed(e))
            };
        }
        const limit = new limits[obj.limit.type]();
        limit.load(obj.limit);
        const result = new BBTagContext(engine, {
            inputRaw: obj.inputRaw,
            message: message,
            isCC: obj.isCC,
            flags: obj.flags,
            rootTagName: obj.rootTagName,
            tagName: obj.tagName,
            author: obj.author,
            authorizer: obj.authorizer,
            state: obj.state,
            limit: limit,
            tagVars: obj.tagVars
        });
        Object.assign(result.scopes.local, obj.scope);

        result.state.cache = {};

        for (const [key, value] of Object.entries(obj.tempVars))
            await result.variables.set(key, value);

        return result;
    }

    public serialize(): SerializedBBTagContext {
        const newState = { ...this.state, cache: undefined, overrides: undefined };
        const newScope = { ...this.scopes.local };
        return {
            msg: {
                id: this.message.id,
                timestamp: this.message.createdTimestamp,
                content: this.message.content,
                channel: serializeEntity(this.channel),
                member: serializeEntity(this.member),
                attachments: this.message.attachments.map(a => ({ id: a.id, name: a.name ?? 'file', url: a.url })),
                embeds: this.message.embeds.map(e => <MessageEmbedOptions>e.toJSON())
            },
            isCC: this.isCC,
            state: newState,
            scope: newScope,
            inputRaw: this.inputRaw,
            flags: this.flags,
            rootTagName: this.rootTagName,
            tagName: this.tagName,
            tagVars: this.tagVars,
            author: this.author,
            authorizer: this.authorizer,
            limit: this.limit.serialize(),
            tempVars: this.variables.list
                .filter(v => v.key.startsWith('~'))
                .reduce<Record<string, JToken>>((p, v) => {
                    p[v.key] = v.value;
                    return p;
                }, {})
        };
    }
}
