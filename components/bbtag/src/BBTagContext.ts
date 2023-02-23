import { humanize } from '@blargbot/core/utils/index.js';
import { Emote } from '@blargbot/discord-emote';
import { findRolePosition, permission } from '@blargbot/discord-util';
import type { FlagDefinition, FlagResult } from '@blargbot/flags';
import { hasFlag } from '@blargbot/guards';
import { Timer } from '@blargbot/timer';
import * as Discord from 'discord-api-types/v10';
import { AllowedMentionsTypes } from 'discord-api-types/v10';
import type moment from 'moment-timezone';
import ReadWriteLock from 'rwlock';

import type { BBTagEngine } from './BBTagEngine.js';
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
import type { BBTagContextOptions, BBTagContextState, BBTagRuntimeScope, Entities, LocatedRuntimeError, RuntimeDebugEntry, SerializedBBTagContext } from './types.js';
import { BBTagRuntimeState } from './types.js';

function serializeEntity(entity: { id: string; }): { id: string; serialized: string; }
function serializeEntity(entity?: { id: string; }): { id: string; serialized: string; } | undefined
function serializeEntity(entity?: { id: string; }): { id: string; serialized: string; } | undefined {
    if (entity === undefined)
        return undefined;
    return { id: entity.id, serialized: JSON.stringify(entity) };
}

export class BBTagContext implements BBTagContextOptions {
    #parent?: BBTagContext;

    public readonly engine: BBTagEngine;
    public readonly message: Entities.Message;
    public readonly inputRaw: string;
    public readonly input: string[];
    public readonly flags: ReadonlyArray<FlagDefinition<string>>;
    public readonly isCC: boolean;
    public readonly tagVars: boolean;
    public readonly authorId: string | undefined;
    public readonly authorizer: Entities.User;
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
    public readonly prefix?: string;
    public readonly bot: Entities.User;
    public readonly channel: Entities.Channel;
    public readonly user: Entities.User;
    public readonly guild: Entities.Guild;
    public readonly isStaff: boolean;
    public readonly botPermissions: bigint;
    public readonly userPermissions: bigint;
    public readonly authorizerPermissions: bigint;

    public get parent(): BBTagContext | undefined { return this.#parent; }
    public get totalElapsed(): number { return this.execTimer.elapsed + this.dbTimer.elapsed; }
    public get cooldownEnd(): moment.Moment { return this.cooldowns.get(this); }

    public constructor(
        engine: BBTagEngine,
        options: BBTagContextOptions
    ) {
        this.engine = engine;
        this.guild = options.guild;
        this.bot = options.bot;
        this.botPermissions = this.getPermission(this.bot);
        this.user = options.user;
        this.userPermissions = this.getPermission(this.user);
        this.authorizer = options.authorizer;
        this.authorizerPermissions = this.getPermission(this.authorizer);
        this.channel = options.channel;
        this.isStaff = options.isStaff;
        this.message = options.message;
        this.prefix = options.prefix;
        this.inputRaw = options.inputRaw;
        this.input = humanize.smartSplit(options.inputRaw);
        this.flags = options.flags ?? [];
        this.isCC = options.isCC;
        this.tagVars = options.tagVars ?? !this.isCC;
        this.authorId = options.authorId;
        this.rootTagName = options.rootTagName ?? options.tagName ?? 'unknown';
        this.tagName = options.tagName ?? this.rootTagName;
        this.cooldown = options.cooldown ?? 0;
        this.cooldowns = options.cooldowns ?? new TagCooldownManager();
        this.locks = options.locks ?? {};
        this.limit = typeof options.limit === 'string' ? new limits[options.limit](this.guild) : options.limit;
        this.silent = options.silent ?? false;
        this.flaggedInput = engine.dependencies.parseFlags(this.flags, this.inputRaw);
        this.errors = [];
        this.debug = [];
        this.scopes = options.scopes ?? new ScopeManager();
        this.callStack = options.callStack ?? new SubtagCallStack();
        this.variables = options.variables ?? new VariableCache(this, engine.variables);
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

    public getPermission(user: Entities.User, channel?: Entities.Channel): bigint {
        if (user.id === this.guild.id)
            return -1n;

        return permission.discover(
            user.id,
            this.guild.owner_id,
            user.member?.roles ?? [],
            this.guild.roles,
            channel?.permission_overwrites
        );
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

    public roleEditPosition(user: Entities.User, channel?: Entities.Channel): number {
        if (this.guild.owner_id === this.authorizer.id)
            return Infinity;

        const permission = this.getPermission(user, channel);
        if (!hasFlag(permission, Discord.PermissionFlagsBits.ManageRoles))
            return -Infinity;

        return findRolePosition(this.authorizer.member?.roles ?? [], this.guild.roles);
    }

    public auditReason(user: Entities.User = this.user): string {
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
        let result = this.engine.subtags.get(name);
        if (result !== undefined)
            return result;

        result = this.engine.subtags.get(`${name.split('.', 1)[0]}.`);
        if (result !== undefined)
            return result;

        throw new UnknownSubtagError(name);
    }

    public addError(error: BBTagRuntimeError, subtag?: SubtagCall): string {
        this.errors.push({ subtag: subtag, error });
        return error.display ?? this.scopes.local.fallback ?? `\`${error.message}\``;
    }

    public async bulkLookup<T>(source: string, lookup: (value: string) => Awaitable<T | undefined>, error: new (term: string) => BBTagRuntimeError): Promise<T[] | undefined> {
        if (source === '')
            return undefined;

        const flatSource = this.engine.dependencies.arrayTools.flattenArray([source]).map(i => this.engine.dependencies.converter.string(i));
        return await Promise.all(flatSource.map(async input => {
            const element = await lookup(input);
            if (element === undefined)
                throw new error(input);
            return element;
        }));
    }

    public getLock(key: string): ReadWriteLock {
        return this.locks[key] ??= new ReadWriteLock();
    }

    async #sendOutput(text: string): Promise<string | undefined> {
        const disableEveryone = !this.isCC || !this.data.allowedMentions.everybody;
        const response = await this.engine.dependencies.services.message.create(this, this.channel.id, {
            content: text,
            embeds: this.data.embeds !== undefined ? this.data.embeds : undefined,
            allowed_mentions: {
                parse: disableEveryone ? [] : [AllowedMentionsTypes.Everyone],
                roles: this.isCC ? this.data.allowedMentions.roles : undefined,
                users: this.isCC ? this.data.allowedMentions.users : undefined
            },
            files: this.data.file !== undefined ? [this.data.file] : undefined
        });

        if (response === undefined)
            return undefined;

        if ('error' in response) {
            if (response.error === 'No content')
                return undefined;
            throw new Error('Failed to send message');
        }

        this.data.ownedMsgs.push(response.id);
        await this.engine.dependencies.services.message.addReactions(this, this.channel.id, response.id, [...new Set(this.data.reactions)].map(Emote.parse));
        return response.id;
    }

    public async sendOutput(text: string): Promise<string | undefined> {
        if (this.silent)
            return this.data.outputMessage;
        return this.data.outputMessage ??= await this.#sendOutput(text);
    }

    public async getTag(type: 'tag' | 'cc', key: string): Promise<{ content: string; cooldown?: number; } | null> {
        const cacheKey = `${type}_${key}`;
        if (cacheKey in this.data.cache)
            return this.data.cache[cacheKey];
        const fetchedValue = await this.engine.dependencies.sources.get(this, type, key);
        if (fetchedValue !== undefined)
            return this.data.cache[cacheKey] = fetchedValue;
        return this.data.cache[cacheKey] = null;
    }

    public serialize(): SerializedBBTagContext {
        return {
            msg: {
                id: this.message.id,
                content: this.message.content,
                channel: serializeEntity(this.channel),
                member: serializeEntity(this.user),
                attachments: this.message.attachments,
                embeds: this.message.embeds
            },
            isCC: this.isCC,
            scope: { ...this.scopes.local },
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
            authorizer: this.authorizer.id,
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
}
