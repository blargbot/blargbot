import type { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core';
import { discord, Emote, guard, hasFlag, Timer } from '@blargbot/core';
import type { Logger } from '@blargbot/logger';
import * as eris from 'eris';

import type { BBTagEngine } from './BBTagEngine.js';
import type { BBTagUtilities } from './BBTagUtilities.js';
import type { BBTagRuntimeError } from './errors/index.js';
import { SubtagStackOverflowError, UnknownSubtagError } from './errors/index.js';
import type { BBTagExpression, SubtagCall } from './language/index.js';
import { memoize } from './memoize.js';
import type { Subtag } from './Subtag.js';
import { SubtagCallStack } from './SubtagCallStack.js';
import type { BBTagRuntimeRootScope, BBTagRuntimeScope, FindEntityOptions, LocatedRuntimeError, RuntimeDebugEntry } from './types.js';
import { BBTagRuntimeState } from './types.js';

export class BBTagContext {
    #isStaffPromise?: Promise<boolean>;
    readonly #scopes: BBTagRuntimeScope[] = [];
    #local: BBTagRuntimeScope;

    public readonly authorizer: eris.Member | undefined;
    public readonly execTimer: Timer;
    public readonly dbTimer: Timer;
    public readonly errors: LocatedRuntimeError[];
    public readonly debug: RuntimeDebugEntry[];
    public readonly callStack = new SubtagCallStack();
    public readonly permission: eris.Permission;
    public readonly subtagInvocations = new Map<string, number[]>();
    public readonly root: BBTagRuntimeRootScope;

    public dbObjectsCommitted: number;
    public state: BBTagRuntimeState = BBTagRuntimeState.RUNNING;
    public subtagCount = 0;

    public get logger(): Logger { return this.engine.logger; }
    public get util(): BBTagUtilities { return this.engine.util; }
    public get discord(): eris.Client { return this.engine.discord; }
    public get subtags(): ReadonlyMap<string, Subtag> { return this.engine.subtags; }

    public get local(): BBTagRuntimeScope {
        return this.#local;
    }

    public get bot(): eris.Member {
        const member = this.local.message.channel.guild.members.get(this.discord.user.id);
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
        root: BBTagRuntimeRootScope
    ) {
        this.root = root;
        this.#local = root;
        this.authorizer = this.local.message.channel.guild.members.get(this.root.authorizer);
        this.permission = this.authorizer?.permissions ?? (this.local.message.channel.guild.id === this.root.authorizer ? new eris.Permission(8n) : new eris.Permission(0n));
        if (this.permission.has('administrator'))
            this.permission = new eris.Permission(~0n);
        this.errors = [];
        this.debug = [];
        this.execTimer = new Timer();
        this.dbTimer = new Timer();
        this.dbObjectsCommitted = 0;
    }

    public permissionIn(channel: eris.KnownGuildChannel): eris.Permission {
        if (this.authorizer === undefined)
            return new eris.Permission(0n);
        const permissions = channel.permissionsOf(this.authorizer);
        if (permissions.has('administrator'))
            return new eris.Permission(eris.Constants.Permissions.all);
        return permissions;
    }

    public usingStack(): Disposable {
        if (this.root.recursion.depth >= 200) {
            this.state = BBTagRuntimeState.ABORT;
            throw new SubtagStackOverflowError(this.root.recursion.depth);
        }

        this.root.recursion.depth++;
        return {
            [Symbol.dispose]: memoize(() => this.root.recursion.depth--)
        };
    }

    public usingScope(): Disposable & BBTagRuntimeScope {
        const scope = Object.create(this.#local, {
            [Symbol.dispose]: {
                configurable: false,
                enumerable: false,
                writable: false,
                value: memoize(() => {
                    if (this.#scopes.length === 0)
                        throw new Error('Cannot pop the root scope');
                    this.#scopes.pop();
                    this.#local = this.#scopes.at(-1) ?? this.root;
                })
            }
        });
        this.#scopes.push(scope);
        this.#local = scope;
        return scope;
    }

    public hasPermission(permission: bigint | keyof eris.Constants['Permissions']): boolean;
    public hasPermission(channel: eris.KnownGuildChannel, permission: bigint | keyof eris.Constants['Permissions']): boolean;
    public hasPermission(...args: [permission: bigint | keyof eris.Constants['Permissions']] | [channel: eris.KnownGuildChannel, permission: bigint | keyof eris.Constants['Permissions']]): boolean {
        const [permissions, permission] = args.length === 1
            ? [this.permission, args[0]]
            : [this.permissionIn(args[0]), args[1]];

        const flags = typeof permission === 'bigint' ? permission : eris.Constants.Permissions[permission];
        return hasFlag(permissions.allow, flags);
    }

    public roleEditPosition(channel?: eris.KnownGuildChannel): number {
        if (this.local.message.channel.guild.ownerID === this.authorizer?.id)
            return Infinity;

        const permission = channel === undefined ? this.permission : this.permissionIn(channel);
        if (!permission.has('manageRoles'))
            return -Infinity;

        return discord.getMemberPosition(this.authorizer);
    }

    public auditReason(user: eris.User = this.local.message.author): string {
        const reason = this.local.reason ?? '';
        const tag = `${user.username}#${user.discriminator}`;
        return reason.length > 0
            ? `${tag}: ${reason}`
            : tag;
    }

    public eval(bbtag: SubtagCall | BBTagExpression): Promise<string> {
        return this.engine.eval(bbtag, this);
    }

    public ownsMessage(messageId: string): boolean {
        return messageId === this.root.message.id || this.root.ownedMessageIds.has(messageId);
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
        return error.display ?? this.local.fallback ?? `\`${error.message}\``;
    }

    public async queryUser(query: string | undefined, options: FindEntityOptions = {}): Promise<eris.User | undefined> {
        if (query === '' || query === undefined || query === this.local.message.author.id)
            return this.local.message.author;
        const user = await this.util.getUser(query);
        if (user !== undefined)
            return user;
        const member = await this.queryMember(query, options);
        return member?.user;
    }

    public async queryMember(query: string | undefined, options: FindEntityOptions = {}): Promise<eris.Member | undefined> {
        if (query === '' || query === undefined || query === this.local.message.member.id)
            return this.local.message.member;
        return await this.#queryEntity(
            query, 'user', 'User',
            async (id) => await this.util.getMember(this.local.message.channel.guild, id),
            async (query) => await this.util.findMembers(this.local.message.channel.guild, query),
            async (options) => await this.util.queryMember(options),
            options
        );
    }

    public async queryRole(query: string, options: FindEntityOptions = {}): Promise<eris.Role | undefined> {
        return await this.#queryEntity(
            query, 'role', 'Role',
            async (id) => await this.util.getRole(this.local.message.channel.guild, id),
            async (query) => await this.util.findRoles(this.local.message.channel.guild, query),
            async (options) => await this.util.queryRole(options),
            options
        );
    }

    public async queryChannel(query: string | undefined, options: FindEntityOptions = {}): Promise<eris.KnownGuildChannel | undefined> {
        if (query === '' || query === undefined || query === this.local.message.channel.id)
            return this.local.message.channel;
        return await this.#queryEntity(
            query, 'channel', 'Channel',
            async (id) => {
                const channel = await this.util.getChannel(this.local.message.channel.guild, id);
                return channel !== undefined && guard.isGuildChannel(channel) && channel.guild.id === this.local.message.channel.guild.id ? channel : undefined;
            },
            async (query) => await this.util.findChannels(this.local.message.channel.guild, query),
            async (options) => await this.util.queryChannel(options),
            options
        );
    }

    public async queryThread(query: string | undefined, options: FindEntityOptions = {}): Promise<eris.KnownThreadChannel | undefined> {
        if (guard.isThreadChannel(this.local.message.channel) && (query === '' || query === undefined || query === this.local.message.channel.id))
            return this.local.message.channel;
        return await this.#queryEntity(
            query ?? '', 'channel', 'Thread',
            async (id) => threadsOnly(await this.util.getChannel(this.local.message.channel.guild, id)),
            async (query) => threadsOnly(await this.util.findChannels(this.local.message.channel.guild, query)),
            async (options) => await this.util.queryChannel(options),
            options
        );
    }

    public async getMessage(channel: eris.KnownChannel, messageId: string, force?: boolean): Promise<eris.KnownMessage | undefined>
    public async getMessage<T extends eris.KnownTextableChannel>(channel: T, messageId: string, force?: boolean): Promise<eris.Message<T> | undefined>
    public async getMessage(channel: eris.KnownChannel, messageId: string, force = false): Promise<eris.KnownMessage | undefined> {
        if (!force) {
            for (const scope of [this.root, ...this.#scopes].reverse()) {
                if (Reflect.has(scope, 'message')) {
                    const message = scope.message;
                    if (message.channel.id !== channel.id)
                        continue;
                    if ((messageId === '' || messageId === message.id) && message instanceof eris.Message)
                        return message;
                }
            }
        }

        return await this.util.getMessage(channel, messageId, force);
    }

    async #queryEntity<T extends { id: string; }>(
        queryString: string,
        cacheKey: 'user' | 'role' | 'channel',
        type: string,
        fetch: (id: string) => Promise<T | undefined>,
        find: (query: string) => Promise<T[]>,
        query: (options: EntityPickQueryOptions<string, T>) => Promise<ChoiceQueryResult<T>>,
        options: FindEntityOptions
    ): Promise<T | undefined> {
        const cached = this.root.queryCache[cacheKey].get(queryString);
        if (cached !== undefined)
            return await fetch(cached) ?? undefined;

        const noLookup = options.noLookup === true || this.local.quiet === true;
        const entities = await find(queryString);
        if (entities.length <= 1 || this.root.queryCache.count >= 5 || noLookup)
            return entities.length === 1 ? entities[0] ?? undefined : undefined;

        const result = await query({ context: this.local.message.channel, actors: this.local.message.author.id, choices: entities, filter: queryString });
        const noErrors = options.noErrors === true || this.local.noLookupErrors === true;
        switch (result.state) {
            case 'FAILED':
            case 'NO_OPTIONS':
                if (!noErrors) {
                    await this.util.send(this.local.message.channel, { content: `No ${type.toLowerCase()} matching \`${queryString}\` found in ${this.root.isCC ? 'custom command' : 'tag'} \`${this.root.tagName}\`.` });
                    this.root.queryCache.count++;
                }
                return undefined;
            case 'TIMED_OUT':
            case 'CANCELLED':
                this.root.queryCache.count = Infinity;
                if (!noErrors)
                    await this.util.send(this.local.message.channel, { content: `${type} query canceled in ${this.root.isCC ? 'custom command' : 'tag'} \`${this.root.tagName}\`.` });
                return undefined;
            case 'SUCCESS':
                this.root.queryCache[cacheKey].set(queryString, result.value.id);
                return result.value;
            default:
                return result;
        }
    }

    async #sendOutput(text: string): Promise<string | undefined> {
        let disableEveryone = true;
        if (this.root.isCC) {
            disableEveryone = await this.engine.database.guilds.getSetting(this.local.message.channel.guild.id, 'disableeveryone') ?? false;
            disableEveryone ||= !this.root.allowedMentions.everybody;

            this.engine.logger.log('Allowed mentions:', this.root.allowedMentions, disableEveryone);
        }
        try {
            const response = await this.engine.util.send(this.root.message.channel, {
                content: text,
                embeds: this.root.output.embeds,
                nsfw: this.root.output.nsfw,
                allowedMentions: {
                    everyone: !disableEveryone,
                    roles: this.root.isCC ? [...this.root.allowedMentions.roles] : undefined,
                    users: this.root.isCC ? [...this.root.allowedMentions.users] : undefined
                },
                file: this.root.output.files
            });

            if (response !== undefined) {
                await this.util.addReactions(response, [...new Set(this.root.output.reactions)].map(Emote.parse));
                this.root.ownedMessageIds.add(response.id);
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
            throw new Error('Failed to send message', {
                cause: err
            });
        }
    }

    public async sendOutput(text: string): Promise<string | undefined> {
        if (this.root.silent)
            return this.root.output.messageId;
        return this.root.output.messageId ??= await this.#sendOutput(text);
    }
}

function threadsOnly(channel: eris.KnownChannel | undefined): eris.KnownThreadChannel | undefined
function threadsOnly(channel: eris.KnownChannel[]): eris.KnownThreadChannel[]
function threadsOnly(channel: eris.KnownChannel | eris.KnownChannel[] | undefined): eris.KnownThreadChannel | eris.KnownThreadChannel[] | undefined {
    if (Array.isArray(channel))
        return channel.filter(guard.isThreadChannel);
    if (channel === undefined || guard.isThreadChannel(channel))
        return channel;
    return undefined;
}
