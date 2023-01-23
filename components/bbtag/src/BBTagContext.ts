import type { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core/types.js';
import { discord } from '@blargbot/core/utils/discord/index.js';
import { guard, hasFlag, humanize, parse } from '@blargbot/core/utils/index.js';
import type { Database } from '@blargbot/database';
import { Emote } from '@blargbot/discord-emote';
import type { FlagDefinition, FlagResult, NamedGuildCommandTag, StoredTag } from '@blargbot/domain/models/index.js';
import type { Logger } from '@blargbot/logger';
import { Timer } from '@blargbot/timer';
import * as Eris from 'eris';
import type moment from 'moment-timezone';
import ReadWriteLock from 'rwlock';

import type { BBTagEngine } from './BBTagEngine.js';
import type { BBTagUtilities } from './BBTagUtilities.js';
import { VariableCache } from './Caching.js';
import type { BBTagRuntimeError } from './errors/index.js';
import { SubtagStackOverflowError, UnknownSubtagError } from './errors/index.js';
import type { Statement, SubtagCall } from './language/index.js';
import type { RuntimeLimit } from './limits/index.js';
import { limits } from './limits/index.js';
import { ScopeManager } from './ScopeManager.js';
import type { Subtag } from './Subtag.js';
import { SubtagCallStack } from './SubtagCallStack.js';
import { TagCooldownManager } from './TagCooldownManager.js';
import { tagVariableScopeProviders } from './tagVariableScopeProviders.js';
import type { BBTagContextMessage, BBTagContextOptions, BBTagContextState, BBTagRuntimeScope, FindEntityOptions, LocatedRuntimeError, RuntimeDebugEntry, SerializedBBTagContext } from './types.js';
import { BBTagRuntimeState } from './types.js';

function serializeEntity(entity: { id: string; }): { id: string; serialized: string; }
function serializeEntity(entity?: { id: string; }): { id: string; serialized: string; } | undefined
function serializeEntity(entity?: { id: string; }): { id: string; serialized: string; } | undefined {
    if (entity === undefined)
        return undefined;
    return { id: entity.id, serialized: JSON.stringify(entity) };
}

export class BBTagContext implements BBTagContextOptions {
    #isStaffPromise?: Promise<boolean>;
    #parent?: BBTagContext;

    public readonly message: BBTagContextMessage;
    public readonly inputRaw: string;
    public readonly input: string[];
    public readonly flags: ReadonlyArray<FlagDefinition<string>>;
    public readonly isCC: boolean;
    public readonly tagVars: boolean;
    public readonly authorId: string | undefined;
    public readonly authorizer: Eris.Member | undefined;
    public readonly authorizerId: string | undefined;
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
    public readonly data: BBTagContextState;
    public readonly callStack: SubtagCallStack;
    public readonly permission: Eris.Permission;
    public readonly prefix?: string;

    public get parent(): BBTagContext | undefined { return this.#parent; }
    public get totalElapsed(): number { return this.execTimer.elapsed + this.dbTimer.elapsed; }
    public get channel(): Eris.KnownGuildTextableChannel { return this.message.channel; }
    public get member(): Eris.Member | undefined { return (this.message.member as Eris.Member | null) ?? undefined; }
    public get guild(): Eris.Guild { return this.message.channel.guild; }
    public get user(): Eris.User { return this.message.author; }
    public get database(): Database { return this.engine.database; }
    public get logger(): Logger { return this.engine.logger; }
    public get util(): BBTagUtilities { return this.engine.util; }
    public get discord(): Eris.Client { return this.engine.discord; }
    public get subtags(): ReadonlyMap<string, Subtag> { return this.engine.subtags; }
    public get cooldownEnd(): moment.Moment { return this.cooldowns.get(this); }

    public get bot(): Eris.Member {
        const member = this.guild.members.get(this.discord.user.id);
        if (member === undefined)
            throw new Error('Bot is not a member of the current guild');
        return member;
    }

    public get isStaff(): Promise<boolean> {
        return this.#isStaffPromise ??= this.authorizer === undefined
            ? Promise.resolve(false)
            : this.engine.util.isUserStaff(this.authorizer);
    }

    public constructor(
        public readonly engine: BBTagEngine,
        options: BBTagContextOptions
    ) {
        this.message = options.message;
        this.prefix = options.prefix;
        this.inputRaw = options.inputRaw;
        this.input = humanize.smartSplit(options.inputRaw);
        this.flags = options.flags ?? [];
        this.isCC = options.isCC;
        this.tagVars = options.tagVars ?? !this.isCC;
        this.authorId = options.authorId;
        this.authorizerId = options.authorizerId ?? this.authorId;
        this.authorizer = this.guild.members.get(this.authorizerId ?? '');
        this.permission = this.authorizer === undefined
            ? this.authorizerId === undefined ? new Eris.Permission(8n) : new Eris.Permission(0n)
            : this.authorizer.permissions.has('administrator') ? new Eris.Permission(Eris.Constants.Permissions.all)
                : this.authorizer.permissions;
        this.rootTagName = options.rootTagName ?? options.tagName ?? 'unknown';
        this.tagName = options.tagName ?? this.rootTagName;
        this.cooldown = options.cooldown ?? 0;
        this.cooldowns = options.cooldowns ?? new TagCooldownManager();
        this.locks = options.locks ?? {};
        this.limit = typeof options.limit === 'string' ? new limits[options.limit](this.guild) : options.limit;
        this.silent = options.silent ?? false;
        this.flaggedInput = parse.flags(this.flags, this.inputRaw);
        this.errors = [];
        this.debug = [];
        this.scopes = options.scopes ?? new ScopeManager();
        this.callStack = options.callStack ?? new SubtagCallStack();
        this.variables = options.variables ?? new VariableCache(this, tagVariableScopeProviders);
        this.execTimer = new Timer();
        this.dbTimer = new Timer();
        this.dbObjectsCommitted = 0;
        this.data = Object.assign(options.data ?? {}, {
            query: {
                count: 0,
                user: {},
                role: {},
                channel: {}
            },
            outputMessage: undefined,
            ownedMsgs: [],
            state: BBTagRuntimeState.RUNNING,
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
            ...options.data ?? {}
        });
    }

    public permissionIn(channel: Eris.KnownGuildChannel): Eris.Permission {
        if (this.authorizer === undefined)
            return new Eris.Permission(0n);
        const permissions = channel.permissionsOf(this.authorizer);
        if (permissions.has('administrator'))
            return new Eris.Permission(Eris.Constants.Permissions.all);
        return permissions;
    }

    public withStack<T>(action: () => T, maxStack = 200): T {
        if (this.data.stackSize >= maxStack) {
            this.data.state = BBTagRuntimeState.ABORT;
            throw new SubtagStackOverflowError(this.data.stackSize);
        }

        this.data.stackSize++;
        let result;

        try {
            result = action();
        } finally {
            if (result instanceof Promise)
                result.finally(() => this.data.stackSize--);

            else
                this.data.stackSize--;
        }

        return result;
    }

    public withScope<T>(action: (scope: BBTagRuntimeScope) => T): T;
    public withScope<T>(isTag: boolean, action: (scope: BBTagRuntimeScope) => T): T;
    public withScope<T>(...args: [isTag: boolean, action: (scope: BBTagRuntimeScope) => T] | [action: (scope: BBTagRuntimeScope) => T]): T {
        const [isTag, action] = args.length === 2 ? args : [false, args[0]];
        return this.scopes.withScope(action, isTag);
    }

    public withChild<T>(options: Partial<BBTagContextOptions>, action: (context: BBTagContext) => T): T {
        const context = new BBTagContext(this.engine, {
            ...this,
            ...options,
            silent: false // regression bug, this wasnt copied in the old codebase :(
        });
        context.#parent = this;

        let result;
        try {
            result = action(context);
        } finally {
            if (result instanceof Promise)
                result.finally(() => this.errors.push(...context.errors));

            else
                this.errors.push(...context.errors);
        }

        return result;
    }

    public hasPermission(permission: bigint | keyof Eris.Constants['Permissions']): boolean;
    public hasPermission(channel: Eris.KnownGuildChannel, permission: bigint | keyof Eris.Constants['Permissions']): boolean;
    public hasPermission(...args: [permission: bigint | keyof Eris.Constants['Permissions']] | [channel: Eris.KnownGuildChannel, permission: bigint | keyof Eris.Constants['Permissions']]): boolean {
        const [permissions, permission] = args.length === 1
            ? [this.permission, args[0]]
            : [this.permissionIn(args[0]), args[1]];

        const flags = typeof permission === 'bigint' ? permission : Eris.Constants.Permissions[permission];
        return hasFlag(permissions.allow, flags);
    }

    public roleEditPosition(channel?: Eris.KnownGuildChannel): number {
        if (this.guild.ownerID === this.authorizer?.id)
            return Infinity;

        const permission = channel === undefined ? this.permission : this.permissionIn(channel);
        if (!permission.has('manageRoles'))
            return -Infinity;

        return discord.getMemberPosition(this.authorizer);
    }

    public auditReason(user: Eris.User = this.user): string {
        const reason = this.scopes.local.reason ?? '';
        const tag = `${user.username}#${user.discriminator}`;
        return reason.length > 0
            ? `${tag}: ${reason}`
            : tag;
    }

    public eval(bbtag: SubtagCall | Statement): Awaitable<string> {
        return this.engine.eval(bbtag, this);
    }

    public ownsMessage(messageId: string): boolean {
        return messageId === this.message.id || this.data.ownedMsgs.includes(messageId);
    }

    public getSubtag(name: string): Subtag {
        let result = this.subtags.get(name);
        if (result !== undefined)
            return result;

        result = this.subtags.get(`${name.split('.', 1)[0]}.`);
        if (result !== undefined)
            return result;

        throw new UnknownSubtagError(name);
    }

    public addError(error: BBTagRuntimeError, subtag?: SubtagCall): string {
        this.errors.push({ subtag: subtag, error });
        return error.display ?? this.scopes.local.fallback ?? `\`${error.message}\``;
    }

    public async queryUser(query: string | undefined, options: FindEntityOptions = {}): Promise<Eris.User | undefined> {
        if (query === '' || query === undefined || query === this.user.id)
            return this.user;
        const user = await this.util.getUser(query);
        if (user !== undefined)
            return user;
        const member = await this.queryMember(query, options);
        return member?.user;
    }

    public async queryMember(query: string | undefined, options: FindEntityOptions = {}): Promise<Eris.Member | undefined> {
        if (query === '' || query === undefined || query === this.member?.id)
            return this.member;
        return await this.#queryEntity(
            query, 'user', 'User',
            async (id) => await this.util.getMember(this.guild, id),
            async (query) => await this.util.findMembers(this.guild, query),
            async (options) => await this.util.queryMember(options),
            options
        );
    }

    public async queryRole(query: string, options: FindEntityOptions = {}): Promise<Eris.Role | undefined> {
        return await this.#queryEntity(
            query, 'role', 'Role',
            async (id) => await this.util.getRole(this.guild, id),
            async (query) => await this.util.findRoles(this.guild, query),
            async (options) => await this.util.queryRole(options),
            options
        );
    }

    public async queryChannel(query: string | undefined, options: FindEntityOptions = {}): Promise<Eris.KnownGuildChannel | undefined> {
        if (query === '' || query === undefined || query === this.channel.id)
            return this.channel;
        return await this.#queryEntity(
            query, 'channel', 'Channel',
            async (id) => {
                const channel = await this.util.getChannel(this.guild, id);
                return channel !== undefined && guard.isGuildChannel(channel) && channel.guild.id === this.guild.id ? channel : undefined;
            },
            async (query) => await this.util.findChannels(this.guild, query),
            async (options) => await this.util.queryChannel(options),
            options
        );
    }

    public async queryThread(query: string | undefined, options: FindEntityOptions = {}): Promise<Eris.KnownThreadChannel | undefined> {
        if (guard.isThreadChannel(this.channel) && (query === '' || query === undefined || query === this.channel.id))
            return this.channel;
        return await this.#queryEntity(
            query ?? '', 'channel', 'Thread',
            async (id) => threadsOnly(await this.util.getChannel(this.guild, id)),
            async (query) => threadsOnly(await this.util.findChannels(this.guild, query)),
            async (options) => await this.util.queryChannel(options),
            options
        );
    }

    public async getMessage(channel: Eris.KnownChannel, messageId: string, force?: boolean): Promise<Eris.KnownMessage | undefined>
    public async getMessage<T extends Eris.KnownTextableChannel>(channel: T, messageId: string, force?: boolean): Promise<Eris.Message<T> | undefined>
    public async getMessage(channel: Eris.KnownChannel, messageId: string, force = false): Promise<Eris.KnownMessage | undefined> {
        if (!force && channel.id === this.channel.id && (messageId === this.message.id || messageId === '') && this.message instanceof Eris.Message)
            return this.message;

        return await this.util.getMessage(channel, messageId, force);
    }

    async #queryEntity<T extends { id: string; }>(
        queryString: string,
        cacheKey: FilteredKeys<BBTagContextState['query'], Record<string, string | undefined>>,
        type: string,
        fetch: (id: string) => Promise<T | undefined>,
        find: (query: string) => Promise<T[]>,
        query: (options: EntityPickQueryOptions<string, T>) => Promise<ChoiceQueryResult<T>>,
        options: FindEntityOptions
    ): Promise<T | undefined> {
        const cached = this.data.query[cacheKey][queryString];
        if (cached !== undefined)
            return await fetch(cached) ?? undefined;

        const noLookup = options.noLookup === true || this.scopes.local.quiet === true;
        const entities = await find(queryString);
        if (entities.length <= 1 || this.data.query.count >= 5 || noLookup)
            return entities.length === 1 ? entities[0] ?? undefined : undefined;

        const result = await query({ context: this.channel, actors: this.user.id, choices: entities, filter: queryString });
        const noErrors = options.noErrors === true || this.scopes.local.noLookupErrors === true;
        switch (result.state) {
            case 'FAILED':
            case 'NO_OPTIONS':
                if (!noErrors) {
                    await this.util.send(this.channel, { content: `No ${type.toLowerCase()} matching \`${queryString}\` found in ${this.isCC ? 'custom command' : 'tag'} \`${this.rootTagName}\`.` });
                    this.data.query.count++;
                }
                return undefined;
            case 'TIMED_OUT':
            case 'CANCELLED':
                this.data.query.count = Infinity;
                if (!noErrors)
                    await this.util.send(this.channel, { content: `${type} query canceled in ${this.isCC ? 'custom command' : 'tag'} \`${this.rootTagName}\`.` });
                return undefined;
            case 'SUCCESS':
                this.data.query[cacheKey][queryString] = result.value.id;
                return result.value;
            default:
                return result;
        }
    }

    public getLock(key: string): ReadWriteLock {
        return this.locks[key] ??= new ReadWriteLock();
    }

    async #sendOutput(text: string): Promise<string | undefined> {
        let disableEveryone = true;
        if (this.isCC) {
            disableEveryone = await this.engine.database.guilds.getSetting(this.guild.id, 'disableeveryone') ?? false;
            disableEveryone ||= !this.data.allowedMentions.everybody;

            this.engine.logger.log('Allowed mentions:', this.data.allowedMentions, disableEveryone);
        }
        try {
            const response = await this.engine.util.send(this.message.channel, {
                content: text,
                embeds: this.data.embeds !== undefined ? this.data.embeds : undefined,
                nsfw: this.data.nsfw,
                allowedMentions: {
                    everyone: !disableEveryone,
                    roles: this.isCC ? this.data.allowedMentions.roles : undefined,
                    users: this.isCC ? this.data.allowedMentions.users : undefined
                },
                file: this.data.file !== undefined ? [this.data.file] : undefined
            });

            if (response !== undefined) {
                await this.util.addReactions(response, [...new Set(this.data.reactions)].map(Emote.parse));
                this.data.ownedMsgs.push(response.id);
                return response.id;
            }
            throw new Error('Failed to send message');
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.message === 'No content')
                    return undefined;
                throw err;
            }
            this.logger.error('Failed to send message', err);
            throw new Error('Failed to send message');
        }
    }

    public async sendOutput(text: string): Promise<string | undefined> {
        if (this.silent)
            return this.data.outputMessage;
        return this.data.outputMessage ??= await this.#sendOutput(text);
    }

    public async getTag(type: 'tag', key: string, resolver: (key: string) => Promise<StoredTag | undefined>): Promise<StoredTag | null>;
    public async getTag(type: 'cc', key: string, resolver: (key: string) => Promise<NamedGuildCommandTag | undefined>): Promise<NamedGuildCommandTag | null>;
    public async getTag(type: string, key: string, resolver: (key: string) => Promise<NamedGuildCommandTag | StoredTag | undefined>): Promise<NamedGuildCommandTag | StoredTag | null> {
        const cacheKey = `${type}_${key}`;
        if (cacheKey in this.data.cache)
            return this.data.cache[cacheKey];
        const fetchedValue = await resolver(key);
        if (fetchedValue !== undefined)
            return this.data.cache[cacheKey] = fetchedValue;
        return this.data.cache[cacheKey] = null;
    }

    public static async deserialize(engine: BBTagEngine, obj: SerializedBBTagContext): Promise<BBTagContext> {
        const message = await this.#getOrFabricateMessage(engine, obj);
        const limit = new limits[obj.limit.type]();
        limit.load(obj.limit);
        const result = new BBTagContext(engine, {
            inputRaw: obj.inputRaw,
            message: message,
            isCC: obj.isCC,
            flags: obj.flags,
            rootTagName: obj.rootTagName,
            tagName: obj.tagName,
            data: obj.data,
            authorId: obj.author,
            authorizerId: obj.authorizer,
            limit: limit,
            tagVars: obj.tagVars,
            prefix: obj.prefix
        });
        Object.assign(result.scopes.local, obj.scope);

        result.data.cache = {};

        for (const [key, value] of Object.entries(obj.tempVars))
            await result.variables.set(key, value);

        return result;
    }

    public serialize(): SerializedBBTagContext {
        const newScope = { ...this.scopes.local };
        return {
            msg: {
                id: this.message.id,
                timestamp: this.message.createdAt,
                content: this.message.content,
                channel: serializeEntity(this.channel),
                member: serializeEntity(this.member),
                attachments: this.message.attachments,
                embeds: this.message.embeds
            },
            isCC: this.isCC,
            scope: newScope,
            inputRaw: this.inputRaw,
            data: {
                allowedMentions: this.data.allowedMentions,
                ownedMsgs: this.data.ownedMsgs,
                query: this.data.query,
                stackSize: this.data.stackSize
            },
            prefix: this.prefix,
            flags: this.flags,
            rootTagName: this.rootTagName,
            tagName: this.tagName,
            tagVars: this.tagVars,
            author: this.authorId,
            authorizer: this.authorizerId,
            limit: this.limit.serialize(),
            tempVars: this.variables.list
                .filter(v => v.key.startsWith('~'))
                .reduce<JObject>((p, v) => {
                    if (v.value !== undefined)
                        p[v.key] = v.value;
                    return p;
                }, {})
        };
    }

    static async #getOrFabricateMessage(engine: BBTagEngine, obj: SerializedBBTagContext): Promise<BBTagContextMessage> {
        const msg = await engine.util.getMessage(obj.msg.channel.id, obj.msg.id);
        if (msg !== undefined) {
            if (guard.isGuildMessage(msg))
                return msg;
            throw new Error('Channel must be a guild channel to work with BBTag');
        }

        const channel = await engine.util.getChannel(obj.msg.channel.id);
        if (channel === undefined || !guard.isGuildChannel(channel))
            throw new Error('Channel must be a guild channel to work with BBTag');

        if (!guard.isTextableChannel(channel))
            throw new Error('Channel must be able to send and receive messages to work with BBTag');

        const member = await this.#getOrFabricateMember(engine, channel.guild, obj);
        return {
            id: obj.msg.id,
            createdAt: obj.msg.timestamp,
            content: obj.msg.content,
            channel: channel,
            member: member,
            author: member.user,
            attachments: obj.msg.attachments,
            embeds: obj.msg.embeds
        };
    }

    static async #getOrFabricateMember(engine: BBTagEngine, guild: Eris.Guild, obj: SerializedBBTagContext): Promise<Eris.Member> {
        if (obj.msg.member === undefined)
            throw new Error('No user id given');

        const member = await engine.util.getMember(guild, obj.msg.member.id);
        if (member !== undefined)
            return member;

        const user = await engine.util.getUser(obj.msg.member.id);
        if (user === undefined)
            throw new Error('No user found');

        return new Eris.Member({
            id: user.id,
            avatar: null,
            communication_disabled_until: null,
            deaf: null,
            flags: 0,
            joined_at: null,
            mute: false,
            nick: null,
            premium_since: null,
            pending: false,
            roles: [],
            user: user.toJSON()
        }, guild, engine.dependencies.discord);
    }
}

function threadsOnly(channel: Eris.KnownChannel | undefined): Eris.KnownThreadChannel | undefined
function threadsOnly(channel: Eris.KnownChannel[]): Eris.KnownThreadChannel[]
function threadsOnly(channel: Eris.KnownChannel | Eris.KnownChannel[] | undefined): Eris.KnownThreadChannel | Eris.KnownThreadChannel[] | undefined {
    if (Array.isArray(channel))
        return channel.filter(guard.isThreadChannel);
    if (channel === undefined || guard.isThreadChannel(channel))
        return channel;
    return undefined;
}
