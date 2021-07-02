import { ScopeCollection } from './ScopeCollection';
import { VariableCache, CacheEntry } from './Caching';
import ReadWriteLock from 'rwlock';
import { Duration } from 'moment-timezone';
import { AnyGuildChannel, GuildTextableChannel, Member, User, Guild, Role, Permission } from 'eris';
import { TagCooldownManager } from './TagCooldownManager';
import { BBTagEngine } from './Engine';
import { BBTagContextMessage, BBTagContextOptions, BBTagContextState, BBTagRuntimeScope, FindEntityOptions, FlagDefinition, FlagResult, RuntimeDebugEntry, RuntimeError, RuntimeLimit, RuntimeReturnState, SerializedBBTagContext, Statement, SubtagCall, SubtagHandler } from '../types';
import { Database, oldBu, StoredGuildCommand, StoredTag, Timer } from '../globalCore';
import { bbtagUtil, guard, parse } from '../utils';
import { limits } from './limits';

function serializeEntity(entity: { id: string }): { id: string, serialized: string } {
    return { id: entity.id, serialized: JSON.stringify(entity) };
}

export class BBTagContext implements Required<BBTagContextOptions> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #isStaffPromise?: Promise<boolean>;

    public readonly message: BBTagContextMessage;
    public readonly input: readonly string[];
    public readonly flags: readonly FlagDefinition[];
    public readonly isCC: boolean;
    public readonly tagVars: boolean;
    public readonly author: string;
    public readonly authorizer: string;
    public readonly tagName: string;
    public readonly cooldown: number;
    public readonly cooldowns: TagCooldownManager;
    public readonly locks: Record<string, ReadWriteLock | undefined>;
    public readonly limit: RuntimeLimit;
    // public readonly outputModify: (context: BBTagContext, output: string) => string;
    public readonly silent: boolean;
    public readonly execTimer: Timer;
    public readonly dbTimer: Timer;
    public readonly flaggedInput: FlagResult;
    public readonly errors: RuntimeError[];
    public readonly debug: RuntimeDebugEntry[];
    public readonly scopes: ScopeCollection;
    public readonly variables: VariableCache;
    public dbObjectsCommitted: number;
    public readonly state: BBTagContextState;

    public get totalDuration(): Duration { return this.execTimer.duration.add(this.dbTimer.duration); }
    public get channel(): GuildTextableChannel { return this.message.channel; }
    public get member(): Member { return this.message.member; }
    public get guild(): Guild { return this.message.channel.guild; }
    public get user(): User { return this.message.author; }
    public get scope(): BBTagRuntimeScope { return this.scopes.local; }
    public get isStaff(): Promise<boolean> { return this.#isStaffPromise ??= this.engine.util.isUserStaff(this.authorizer, this.guild.id); }
    public get database(): Database { return this.engine.database; }
    public get logger(): CatLogger { return this.engine.logger; }
    public get permissions(): Permission { return (this.guild.members.get(this.authorizer) || { permissions: new Permission(0, 0) }).permissions; }
    public get perms(): Permission { return this.permissions; }
    public constructor(
        public readonly engine: BBTagEngine,
        options: BBTagContextOptions
    ) {
        if (options.message.member === null)
            throw new Error('The member of a message must be set');
        this.message = <BBTagContextMessage>options.message;
        this.input = options.input;
        this.flags = options.flags ?? [];
        this.isCC = options.isCC;
        this.tagVars = options.tagVars ?? !this.isCC;
        this.author = options.author ?? this.guild.id;
        this.authorizer = options.authorizer ?? this.author;
        this.tagName = options.tagName;
        this.cooldown = options.cooldown ?? 0;
        this.cooldowns = options.cooldowns ?? new TagCooldownManager();
        this.locks = options.locks ?? {};
        this.limit = typeof options.limit === 'function' ? new options.limit() : options.limit;
        // this.outputModify = options.outputModify ?? ((_, r) => r);
        this.silent = options.silent ?? false;
        this.flaggedInput = parse.flags(this.flags, this.input);
        this.errors = [];
        this.debug = [];
        this.scopes = options?.scopes ?? new ScopeCollection();
        this.variables = options?.variables ?? new VariableCache(this);
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
            outputMessage: null,
            ownedMsgs: [],
            return: RuntimeReturnState.NONE,
            stackSize: 0,
            embed: undefined,
            file: undefined,
            reactions: [],
            nsfw: undefined,
            replace: null,
            break: 0,
            continue: 0,
            subtags: {},
            overrides: {},
            cache: {},
            subtagCount: 0,
            allowedMentions: {
                users: [],
                roles: [],
                everybody: false
            },
            ...(options?.state ?? {})
        };
    }

    public async eval(bbtag: Statement): Promise<string> {
        return await this.engine.eval(bbtag, this);
    }

    public ownsMessage(messageId: string): boolean {
        return messageId == this.message.id || this.state.ownedMsgs.indexOf(messageId) != -1;
    }

    public makeChild(options: Partial<BBTagContextOptions> = {}): BBTagContext {
        return new BBTagContext(this.engine, {
            ...this,
            ...options
        });
    }

    public addError(error: string, subtag?: SubtagCall, debugMessage?: string): string {
        this.errors.push({
            subtag: subtag ?? null,
            error: `${bbtagUtil.stringify(subtag?.name ?? ['UNKNOWN SUBTAG'])}: ${error}`,
            debugMessage: debugMessage ?? null
        });
        return this.scope.fallback ?? `\`${error}\``;
    }

    public async getUser(name: string, args: FindEntityOptions = {}): Promise<User | null> {
        let didSend = false;
        if (this.state.query.count >= 5)
            args.quiet = args.suppress = true;
        if (args.onSendCallback)
            args.onSendCallback = ((oldCallback) => () => (didSend = true, oldCallback()))(args.onSendCallback);
        else
            args.onSendCallback = () => didSend = true;

        const cached = this.state.query.user[name];
        if (cached !== undefined) {
            const user = this.engine.discord.users.get(cached);
            if (user)
                return user;
            name = cached;
        }

        let result: User | null = null;
        try {
            result = await this.engine.util.getUser(this.message, name, args);
        } finally { }
        if (didSend)
            this.state.query.count++;
        this.state.query.user[name] = (result || { id: undefined }).id;
        return result;
    }

    public async getRole(name: string, args: FindEntityOptions = {}): Promise<Role | null> {
        let didSend = false;
        if (this.state.query.count >= 5)
            args.quiet = args.suppress = true;
        if (args.onSendCallback)
            args.onSendCallback = ((oldCallback) => () => (didSend = true, oldCallback()))(args.onSendCallback);
        else
            args.onSendCallback = () => didSend = true;

        const cached = this.state.query.role[name];
        if (cached !== undefined)
            return this.engine.discord.guilds.get(this.guild.id)?.roles.get(cached) ?? null;

        let result;
        try {
            result = await this.engine.util.getRole(this.message, name, args);
        } finally { }
        if (didSend)
            this.state.query.count++;
        this.state.query.role[name] = (result || { id: undefined }).id;
        return result;
    }

    public async getChannel(name: string, args: FindEntityOptions = {}): Promise<AnyGuildChannel | null> {
        let didSend = false;
        if (this.state.query.count >= 5)
            args.quiet = args.suppress = true;
        if (args.onSendCallback)
            args.onSendCallback = ((oldCallback) => () => (didSend = true, oldCallback()))(args.onSendCallback);
        else
            args.onSendCallback = () => didSend = true;

        const cached = this.state.query.channel[name];
        if (cached !== undefined)
            return this.engine.discord.guilds.get(this.guild.id)?.channels.get(cached) ?? null;

        let result;
        try {
            result = await this.engine.util.getChannel(this.message, name, args);
            if (result?.type === 1 || result?.type === 3) result = null; //* DM channels, these are not used in BBtag
        } finally { }
        if (didSend)
            this.state.query.count++;
        this.state.query.channel[name] = (result || { id: undefined }).id;
        return result as (AnyGuildChannel | null);
    }

    public override(subtag: string, handler: SubtagHandler): { previous: SubtagHandler | undefined, revert: () => void } {
        const overrides = this.state.overrides;
        const exists = overrides.hasOwnProperty(subtag);
        const previous = overrides[subtag];
        overrides[subtag] = handler;
        return {
            previous,
            revert() {
                if (!exists)
                    delete overrides[subtag];
                else
                    overrides[subtag] = previous;
            }
        };
    }

    public getLock(key: string): ReadWriteLock {
        return this.locks[key] ??= new ReadWriteLock();
    }

    private async _sendOutput(text: string): Promise<string | null> {
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
                    embed: this.state.embed,
                    nsfw: this.state.nsfw,
                    allowedMentions: {
                        everyone: !disableEveryone,
                        roles: !!this.isCC ? this.state.allowedMentions.roles : false,
                        users: !!this.isCC ? this.state.allowedMentions.users : false
                    }
                }, this.state.file);

            if (response) {
                await oldBu.addReactions(response.channel.id, response.id, [...new Set(this.state.reactions)]);
                this.state.ownedMsgs.push(response.id);
                return response.id;
            }
            throw new Error(`Failed to send: ${text}`);
        } catch (err) {
            if (err instanceof Error) {
                if (err.message !== 'No content') {
                    throw err;
                }
                return null;
            }
            throw new Error(`Failed to send: ${text} ${err}`);
        }
    }

    public async sendOutput(text: string): Promise<string | null> {
        if (this.silent) return await this.state.outputMessage;
        return await (this.state.outputMessage ??= this._sendOutput(text));
    }

    public getCached(key: `tag_${string}`, getIfNotSet: (key: string) => StoredTag): StoredTag;
    public getCached(key: `cc_${string}`, getIfNotSet: (key: string) => StoredGuildCommand): StoredGuildCommand;
    public getCached(key: string, getIfNotSet: (key: string) => StoredGuildCommand | StoredTag): StoredGuildCommand | StoredTag {
        if (key in this.state.cache[key])
            return this.state.cache[key];
        return this.state.cache[key] = getIfNotSet(key);
    }

    public static async deserialize(engine: BBTagEngine, obj: SerializedBBTagContext): Promise<BBTagContext> {
        let message: BBTagContextMessage | undefined;
        try {
            const msg = await engine.discord.getMessage(obj.msg.channel.id, obj.msg.id);
            if (!guard.isGuildMessage(msg))
                throw new Error('Channel must be a guild channel to work with BBTag');
            message = <BBTagContextMessage>msg;
        } catch (err) {
            let channel = engine.discord.getChannel(obj.msg.channel.id);
            if (!guard.isGuildChannel(channel))
                throw new Error('Channel must be a guild channel to work with BBTag');
            if (!guard.isTextableChannel(channel))
                throw new Error('Channel must be able to send and receive messages to work with BBTag');

            let member: Member;
            if (channel === null) {
                channel = <GuildTextableChannel>JSON.parse(obj.msg.channel.serialized); // TODO this isnt true
                member = <Member>JSON.parse(obj.msg.member.serialized); // TODO this isnt true
            } else {
                member = channel.guild.members.get(obj.msg.member.id)
                    ?? <Member>JSON.parse(obj.msg.member.serialized); // TODO this isnt true
            }
            message = {
                id: obj.msg.id,
                timestamp: obj.msg.timestamp,
                content: obj.msg.content,
                channel: channel,
                member,
                author: member.user,
                attachments: obj.msg.attachments,
                embeds: obj.msg.embeds
            };
        }
        const limit = new limits[obj.limit.type]();
        limit.load(obj.limit);
        const result = new BBTagContext(engine, {
            input: obj.input,
            message: message,
            isCC: obj.isCC,
            tagName: obj.tagName,
            author: obj.author,
            authorizer: obj.authorizer,
            state: obj.state,
            limit: limit,
            tagVars: obj.tagVars
        });
        Object.assign(result.scopes.local, obj.scope);

        result.state.cache = {};
        result.state.overrides = {};

        for (const key of Object.keys(obj.tempVars || {}))
            await result.variables.set(key, new CacheEntry(result, key, obj.tempVars[key]));
        return result;
    }

    public serialize(): SerializedBBTagContext {
        const newState = { ...this.state, cache: undefined, overrides: undefined };
        const newScope = { ...this.scope };
        return <SerializedBBTagContext>{
            msg: {
                id: this.message.id,
                timestamp: this.message.timestamp,
                content: this.message.content,
                channel: serializeEntity(this.channel),
                member: serializeEntity(this.member),
                attachments: this.message.attachments,
                embeds: this.message.embeds
            },
            isCC: this.isCC,
            state: newState,
            scope: newScope,
            input: this.input,
            flaggedInput: this.flaggedInput,
            tagName: this.tagName,
            tagVars: this.tagVars,
            author: this.author,
            authorizer: this.authorizer,
            limit: this.limit.serialize(),
            tempVars: this.variables.list
                .filter(v => v.key.startsWith('~'))
                .reduce((p, v) => {
                    p[v.key] = v.value;
                    return p;
                }, <Record<string, JToken>>{})
        };
    }
}