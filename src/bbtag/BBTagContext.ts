import type { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core';
import { discord, Timer } from '@blargbot/core';
import { memoize } from '@blargbot/util';
import type * as eris from 'eris';

import type { BBTagEngine } from './BBTagEngine.js';
import type { DiscordPermissionName } from './enums.js';
import { DiscordPermissions } from './enums.js';
import type { BBTagRuntimeError } from './errors/index.js';
import { SubtagStackOverflowError, UnknownSubtagError } from './errors/index.js';
import type { BBTagExpression, SubtagCall } from './language/index.js';
import type { Subtag } from './Subtag.js';
import { SubtagCallStack } from './SubtagCallStack.js';
import type { BBTagRuntimeRootScope, BBTagRuntimeScope, FindEntityOptions, LocatedRuntimeError, RuntimeDebugEntry } from './types.js';
import { BBTagRuntimeState } from './types.js';

export class BBTagContext {
    // #isStaffPromise?: Promise<boolean>;
    readonly #scopes: BBTagRuntimeScope[] = [];
    #local: BBTagRuntimeScope;

    public readonly execTimer = new Timer();
    public readonly dbTimer = new Timer();
    public readonly errors: LocatedRuntimeError[] = [];
    public readonly debug: RuntimeDebugEntry[] = [];
    public readonly callStack = new SubtagCallStack();
    public readonly subtagInvocations = new Map<string, number[]>();
    public readonly root: BBTagRuntimeRootScope;

    public dbObjectsCommitted = 0;
    public state: BBTagRuntimeState = BBTagRuntimeState.RUNNING;
    public subtagCount = 0;

    public get local(): BBTagRuntimeScope {
        return this.#local;
    }

    public constructor(
        public readonly engine: BBTagEngine,
        root: BBTagRuntimeRootScope
    ) {
        this.root = root;
        this.#local = root;
    }

    public permissionIn(channel: eris.KnownGuildChannel | string): DiscordPermissions {
        if (this.root.authorizer === undefined)
            return DiscordPermissions.NONE;
        if (typeof channel === 'string')
            channel = this.engine.discord.getChannel(channel) as eris.KnownGuildChannel;
        const permissions = channel.permissionsOf(this.root.authorizer);
        if (permissions.has('administrator'))
            return new DiscordPermissions(~0n);
        return new DiscordPermissions(permissions.allow);
    }

    public enterRecursion(): Disposable {
        if (this.root.recursion.depth >= 200) {
            this.state = BBTagRuntimeState.ABORT;
            throw new SubtagStackOverflowError(this.root.recursion.depth);
        }

        this.root.recursion.depth++;
        return {
            [Symbol.dispose]: memoize(() => this.root.recursion.depth--)
        };
    }

    public enterScope(): Disposable & BBTagRuntimeScope {
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

    public hasPermission(permission: bigint | DiscordPermissionName, channel?: eris.KnownGuildChannel | string): boolean {
        const target = channel === undefined
            ? this.root.authorizerPermissions
            : this.permissionIn(channel);

        return target.has(permission);
    }

    public roleEditPosition(channel?: eris.KnownGuildChannel): number {
        if (this.root.message.channel.guild.ownerID === this.root.authorizer?.id)
            return Infinity;

        const permission = channel === undefined ? this.root.authorizerPermissions : this.permissionIn(channel);
        if (!permission.has('MANAGE_ROLES'))
            return -Infinity;

        return discord.getMemberPosition(this.root.authorizer);
    }

    public auditReason(user: eris.User = this.root.message.author): string {
        const reason = this.local.reason ?? '';
        const tag = `${user.username}#${user.discriminator}`;
        return reason.length > 0
            ? `${tag}: ${reason}`
            : tag;
    }

    public eval(bbtag: SubtagCall | BBTagExpression): Promise<string> {
        return this.engine.eval(bbtag, this);
    }

    public getSubtag(name: string): Subtag {
        return this.engine.getSubtag(name)
            ?? new UnknownSubtagError(name).throw();
    }

    public addError(error: BBTagRuntimeError, subtag?: SubtagCall): string {
        this.errors.push({ subtag: subtag, error });
        return error.display ?? this.local.fallback ?? `\`${error.message}\``;
    }

    public async queryUser(query: string | undefined, options: FindEntityOptions = {}): Promise<eris.User | undefined> {
        if (query === '' || query === undefined || query === this.local.message.author.id)
            return this.local.message.author;
        const user = await this.engine.util.getUser(query);
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
            async (id) => await this.engine.util.getMember(this.root.message.channel.guild, id),
            async (query) => await this.engine.util.findMembers(this.root.message.channel.guild, query),
            async (options) => await this.engine.util.queryMember(options),
            options
        );
    }

    public async queryRole(query: string, options: FindEntityOptions = {}): Promise<eris.Role | undefined> {
        return await this.#queryEntity(
            query, 'role', 'Role',
            async (id) => await this.engine.util.getRole(this.root.message.channel.guild, id),
            async (query) => await this.engine.util.findRoles(this.root.message.channel.guild, query),
            async (options) => await this.engine.util.queryRole(options),
            options
        );
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
        if (entities.length <= 1 || this.root.queryCache.failedQueries >= 5 || noLookup)
            return entities.length === 1 ? entities[0] ?? undefined : undefined;

        const result = await query({ context: this.local.message.channel, actors: this.root.message.author.id, choices: entities, filter: queryString });
        const noErrors = options.noErrors === true || this.local.noLookupErrors === true;
        switch (result.state) {
            case 'FAILED':
            case 'NO_OPTIONS':
                if (!noErrors) {
                    await this.engine.util.send(this.local.message.channel, { content: `No ${type.toLowerCase()} matching \`${queryString}\` found in ${this.root.isCC ? 'custom command' : 'tag'} \`${this.root.tagName}\`.` });
                    this.root.queryCache.failedQueries++;
                }
                return undefined;
            case 'TIMED_OUT':
            case 'CANCELLED':
                this.root.queryCache.failedQueries = Infinity;
                if (!noErrors)
                    await this.engine.util.send(this.local.message.channel, { content: `${type} query canceled in ${this.root.isCC ? 'custom command' : 'tag'} \`${this.root.tagName}\`.` });
                return undefined;
            case 'SUCCESS':
                this.root.queryCache[cacheKey].set(queryString, result.value.id);
                return result.value;
            default:
                return result;
        }
    }
}
