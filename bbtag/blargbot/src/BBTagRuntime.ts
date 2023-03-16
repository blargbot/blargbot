import type { BBTagStatementToken, BBTagToken } from '@bbtag/language';
import { VariableCache } from '@bbtag/variables';
import { sleep, StackScheduler } from '@blargbot/async-tools';
import { Emote } from '@blargbot/discord-emote';
import Discord, { AllowedMentionsTypes } from '@blargbot/discord-types';
import { findRolePosition, permission } from '@blargbot/discord-util';
import { hasFlag } from '@blargbot/guards';

import type { BBTagRunner } from './BBTagRunner.js';
import { BBTagRuntimeMetrics } from './BBTagRuntimeMetrics.js';
import type { BBTagScriptOptions } from './BBTagScript.js';
import { BBTagScript } from './BBTagScript.js';
import { ContextManager } from './ContextManager.js';
import { BBTagRuntimeError, RuntimeModuleOverflowError } from './errors/index.js';
import type { SubtagDescriptor } from './index.js';
import type { BBTagRuntimeGuard, RuntimeLimit } from './limits/index.js';
import { ScopeManager } from './ScopeManager.js';
import { SubtagCallStack } from './SubtagCallStack.js';
import type { ISubtagLookup } from './SubtagCollection.js';
import { SubtagCollection } from './SubtagCollection.js';
import type { SubtagExecutor } from './SubtagExecutor.js';
import type { BBTagRuntimeScope, Entities, LocatedRuntimeError, RuntimeDebugEntry, TagVariableScope } from './types.js';
import { BBTagRuntimeState } from './types.js';

export class BBTagRuntime {
    readonly #subtags = new SubtagCollection();
    readonly #mainLoop: StackScheduler = new StackScheduler();
    readonly #moduleStack = new ContextManager({
        exit: () => {
            this.#moduleCount--;
            if (this.state === BBTagRuntimeState.RETURN)
                this.state = BBTagRuntimeState.RUNNING;
        },
        enter: () => {
            if (this.#moduleCount >= 200) {
                this.state = BBTagRuntimeState.ABORT;
                throw new RuntimeModuleOverflowError(this.#moduleCount);
            }
            this.#moduleCount++;
        }
    });
    readonly #messageManager = new ContextManager({
        enter: ({ message, channel, user }: { message: Entities.Message; channel: Entities.Channel; user: Entities.User; }) => {
            const result = { message: this.#message, channel: this.#channel, user: this.#user };
            this.#message = message;
            this.#channel = channel;
            this.#user = user;
            return result;
        },
        exit: ({ message, channel, user }: { message: Entities.Message; channel: Entities.Channel; user: Entities.User; }) => {
            this.#message = message;
            this.#channel = channel;
            this.#user = user;
        }
    });
    readonly #snippets: Record<string, BBTagStatementToken> = {};
    readonly #sourceCache: Record<string, { content: string; cooldown: number; } | null> = {};
    #moduleCount = 0;

    readonly #execSubtag: SubtagExecutor;
    #result?: Promise<string>;
    #message: Entities.Message;
    #user: Entities.User;
    #channel: Entities.Channel;

    public readonly runner: BBTagRunner;
    public readonly scopes = new ScopeManager();
    public readonly subtagStack = new SubtagCallStack();
    public readonly limit: BBTagRuntimeGuard;
    public readonly variables: VariableCache<this, TagVariableScope>;
    public readonly authorId: string | null;
    public readonly bot: Entities.User;
    public readonly authorizer: Entities.User;
    public readonly guild: Entities.Guild;
    public readonly isStaff: boolean;
    public readonly isCC: boolean;
    public readonly tagVars: boolean;
    public readonly silent: boolean;
    public readonly prefix: string;
    public readonly queryCache: BBTagRuntimeQueryCache;
    public readonly metrics = new BBTagRuntimeMetrics();

    public state = BBTagRuntimeState.RUNNING;
    public readonly ownedMessageIds = new Set<string>();
    public readonly errors: LocatedRuntimeError[] = [];
    public readonly debug: RuntimeDebugEntry[] = [];
    public readonly botPermissions: bigint;
    public readonly userPermissions: bigint;
    public readonly authorizerPermissions: bigint;

    public readonly outputOptions: OutputOptions;
    public get subtags(): ISubtagLookup {
        return this.#subtags.readonly;
    }
    public get userFunctions(): Readonly<Record<string, BBTagStatementToken>> {
        return { ...this.#snippets };
    }
    public get message(): Entities.Message {
        return this.#message;
    }
    public get user(): Entities.User {
        return this.#user;
    }
    public get channel(): Entities.Channel {
        return this.#channel;
    }
    public get moduleCount(): number {
        return this.#moduleCount;
    }

    public readonly entrypoint: BBTagScript;

    public constructor(runner: BBTagRunner, options: BBTagRuntimeOptions, execSubtag: SubtagExecutor) {
        this.#execSubtag = execSubtag;
        this.#message = options.message;
        this.#user = options.user;
        this.#channel = options.channel;
        this.runner = runner;
        const limit = options.limit;
        this.limit = {
            id: limit.id,
            check: (key) => limit.check(this, key),
            state: () => limit.serialize()
        };
        this.authorId = options.authorId;
        this.bot = options.bot;
        this.authorizer = options.authorizer;
        this.guild = options.guild;
        this.isStaff = options.isStaff;
        this.silent = options.silent;
        this.isCC = options.isCC;
        this.tagVars = options.tagVars;
        this.prefix = options.prefix;
        this.queryCache = options.queryCache;
        this.outputOptions = {
            allowEveryone: false,
            mentionRoles: new Set(),
            mentionUsers: new Set(),
            reactions: [],
            ...options.output
        };
        this.variables = new VariableCache(this, runner.variables);

        for (const subtag of runner.subtags)
            this.#subtags.add(subtag);
        for (const subtag of options.subtags ?? [])
            this.#subtags.add(subtag.createInstance(this.runner));
        this.ownedMessageIds.add(options.message.id);
        this.botPermissions = this.getPermission(this.bot);
        this.userPermissions = this.getPermission(this.user);
        this.authorizerPermissions = this.getPermission(this.authorizer);
        this.entrypoint = this.createScript(options.entrypoint);
    }

    public execute(): Promise<string> {
        if (this.#result !== undefined)
            throw new Error('Cannot execute a runtime multiple times!');
        return this.#result = this.#main();
    }

    async #main(): Promise<string> {
        try {
            const result = this.#mainLoop.schedule(() => this.entrypoint.execute());
            let steps = 0;
            for await (const _ of this.#mainLoop.runUntilEmpty())
                if (++steps % 1000 === 0)
                    await sleep(0);

            return await result;
        } catch (err) {
            if (!(err instanceof BBTagRuntimeError))
                throw err;
            return this.addError(err, this.entrypoint.ast);
        }
    }

    public createScript(options: BBTagScriptOptions): BBTagScript {
        return new BBTagScript(this, options, this.#execSubtag, this.#mainLoop);
    }

    public withModule<T>(action: () => T): T {
        return this.#moduleStack.invoke(action);
    }

    public withScope<T>(action: (scope: BBTagRuntimeScope) => T): T;
    public withScope<T>(isTag: boolean, action: (scope: BBTagRuntimeScope) => T): T;
    public withScope<T>(...args: [isTag: boolean, action: (scope: BBTagRuntimeScope) => T] | [action: (scope: BBTagRuntimeScope) => T]): T {
        const [isTag, action] = args.length === 2 ? args : [false, args[0]];
        return this.scopes.invoke(action, isTag);
    }

    public withMessage<T>(message: Entities.Message, channel: Entities.Channel, user: Entities.User, action: () => T): T {
        return this.#messageManager.invoke(action, { message, channel, user });
    }

    public addError(error: BBTagRuntimeError, token: BBTagToken): string {
        this.errors.push({ token, error });
        return error.display ?? this.scopes.local.fallback ?? `\`${error.message}\``;
    }

    public defineSnippet(id: string, code: BBTagStatementToken): void {
        this.#snippets[id] = code;
        this.#subtags.add({
            id,
            names: [id],
            execute(script, _, call) {
                return script.runtime.withModule(() => {
                    return script.runtime.withScope(async scope => {
                        const params = [];
                        for (const arg of call.args)
                            params.push(await arg.resolve());
                        scope.paramsarray = params;
                        return await script.eval(code);
                    });
                });
            }
        });
    }

    public async output(text: string): Promise<string | undefined> {
        if (this.silent)
            return this.outputOptions.id;
        return this.outputOptions.id ??= await this.#output(text);
    }

    async #output(text: string): Promise<string | undefined> {
        const options = this.outputOptions;
        const disableEveryone = !this.isCC || !options.allowEveryone;
        const response = await this.runner.messages.create(this, this.channel.id, {
            content: text,
            embeds: options.embeds !== undefined ? options.embeds : undefined,
            allowed_mentions: {
                parse: disableEveryone ? [] : [AllowedMentionsTypes.Everyone],
                roles: this.isCC ? [...options.mentionRoles] : undefined,
                users: this.isCC ? [...options.mentionUsers] : undefined
            },
            files: options.file !== undefined ? [options.file] : undefined
        });

        if (response === undefined)
            return undefined;

        if ('error' in response) {
            if (response.error === 'No content')
                return undefined;
            throw new Error('Failed to send message');
        }

        this.ownedMessageIds.add(response.id);
        await this.runner.messages.addReactions(this, this.channel.id, response.id, [...new Set(options.reactions)].map(Emote.parse));
        return response.id;
    }

    public ownsMessage(messageId: string): boolean {
        return this.isStaff || this.ownedMessageIds.has(messageId);
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

    public async getTag(type: 'tag' | 'cc', key: string): Promise<{ content: string; cooldown: number; } | null> {
        const cacheKey = `${type}_${key}`;
        if (cacheKey in this.#sourceCache)
            return this.#sourceCache[cacheKey];
        const fetchedValue = await this.runner.sources.get(this, type, key);
        if (fetchedValue !== undefined)
            return this.#sourceCache[cacheKey] = fetchedValue;
        return this.#sourceCache[cacheKey] = null;
    }

    public async bulkLookup<T>(source: string, lookup: (value: string) => Awaitable<T | undefined>, error: new (term: string) => BBTagRuntimeError): Promise<T[] | undefined> {
        if (source === '')
            return undefined;

        const flatSource = this.runner.arrayTools.flattenArray([source]).map(i => this.runner.converter.string(i));
        return await Promise.all(flatSource.map(async input => {
            const element = await lookup(input);
            if (element === undefined)
                throw new error(input);
            return element;
        }));
    }
}

export interface BBTagRuntimeOptions {
    readonly subtags?: Iterable<SubtagDescriptor>;
    readonly authorId: string | null;
    readonly message: Entities.Message;
    readonly bot: Entities.User;
    readonly authorizer: Entities.User;
    readonly silent: boolean;
    readonly user: Entities.User;
    readonly channel: Entities.Channel;
    readonly guild: Entities.Guild;
    readonly isStaff: boolean;
    readonly isCC: boolean;
    readonly tagVars: boolean;
    readonly limit: RuntimeLimit;
    readonly prefix: string;
    readonly queryCache: BBTagRuntimeQueryCache;
    readonly entrypoint: BBTagScriptOptions;
    readonly output?: Partial<OutputOptions>;
}

export interface BBTagRuntimeQueryCache {
    count: number;
    readonly user: Record<string, string | undefined>;
    readonly role: Record<string, string | undefined>;
    readonly channel: Record<string, string | undefined>;
}

export interface OutputOptions {
    readonly mentionRoles: Set<string>;
    readonly mentionUsers: Set<string>;
    readonly reactions: string[];
    id?: string;
    allowEveryone: boolean;
    replace?: { regex: RegExp | string; with: string; };
    nsfwMessage?: string;
    embeds?: Discord.APIEmbed[];
    file?: {
        readonly name: string;
        readonly file: string;
    };
}
