import { guard, Timer } from '@blargbot/core';
import type { Database } from '@blargbot/database';
import { TagVariableType } from '@blargbot/domain';
import type { Logger } from '@blargbot/logger';
import * as eris from 'eris';

import { BBTagContext } from './BBTagContext.js';
import type { BBTagUtilities, InjectionContext } from './BBTagUtilities.js';
import { VariableCache } from './Caching.js';
import { DiscordPermissions } from './enums.js';
import { BBTagRuntimeError, InternalServerError, TagCooldownError } from './errors/index.js';
import type { BBTagExpression, SubtagCall } from './language/index.js';
import { BaseRuntimeLimit } from './limits/BaseRuntimeLimit.js';
import { memoize } from './memoize.js';
import type { Subtag } from './Subtag.js';
import { OutputSubtag } from './subtags/index.js';
import { TagCooldownManager } from './TagCooldownManager.js';
import { createTagVariableScopeProvider } from './tagVariableScopeProvider.js';
import { templates } from './text.js';
import { toBBTagInput } from './toBBTagInput.js';
import type { AnalysisResults, BBTagContextMessage, BBTagRuntimeInput, ExecutionResult, SerializedBBTagContext } from './types.js';
import { BBTagRuntimeState } from './types.js';
import { bbtag as bbtagUtil } from './utils/index.js';

export class BBTagEngine {
    public get discord(): eris.Client { return this.dependencies.discord; }
    public get logger(): Logger { return this.dependencies.logger; }
    public get database(): Database { return this.dependencies.database; }
    public get util(): BBTagUtilities { return this.dependencies.util; }
    public readonly subtags: ReadonlyMap<string, Subtag>;

    public readonly cooldowns: TagCooldownManager;

    public constructor(
        public readonly dependencies: InjectionContext
    ) {
        this.cooldowns = new TagCooldownManager();
        const subtags = new Map<string, Subtag>();
        this.subtags = subtags;
        for (const subtag of dependencies.subtags) {
            for (const name of BBTagEngine.#subtagNames(subtag)) {
                const current = subtags.get(name);
                if (current !== undefined)
                    throw new Error(`Duplicate subtag with name ${JSON.stringify(subtag.name)} found`);
                subtags.set(name, subtag);
            }
        }
    }

    static * #subtagNames(subtag: Subtag): Generator<string> {
        yield subtag.name.toLowerCase();
        for (const alias of subtag.aliases)
            yield alias.toLowerCase();
    }

    public createContext(options: BBTagRuntimeInput): BBTagContext {
        const authorizerId = options.authorizer ?? options.author ?? options.message.channel.guild.id;
        const authorizer = options.message.channel.guild.members.get(authorizerId);
        const authorizerPermissions = authorizer?.permissions ?? (options.message.channel.guild.id === authorizerId
            ? new eris.Permission(8n)
            : new eris.Permission(0n)
        );
        const context = new BBTagContext(this, {
            botId: this.discord.user.id,
            recursion: {
                depth: 0
            },
            output: {
                nsfw: undefined,
                messageId: undefined,
                embeds: undefined,
                files: undefined,
                replace: undefined,
                reactions: []
            },
            variables: new VariableCache(
                createTagVariableScopeProvider(
                    {
                        get: (scope, name) => this.database.tagVariables.get(name, scope),
                        upsert: (scope, entries) => this.database.tagVariables.upsert(entries, scope)
                    },
                    {
                        global: { type: TagVariableType.GLOBAL },
                        local: !options.tagVars
                            ? { type: TagVariableType.LOCAL_CC, guildId: options.message.channel.guild.id, name: options.tagName }
                            : { type: TagVariableType.LOCAL_TAG, name: options.tagName },
                        author: options.author !== undefined
                            ? { type: TagVariableType.AUTHOR, authorId: options.author }
                            : undefined,
                        guild: !options.tagVars
                            ? { type: TagVariableType.GUILD_CC, guildId: options.message.channel.guild.id }
                            : { type: TagVariableType.GUILD_TAG, guildId: options.message.channel.guild.id }
                    }
                ),
                {
                    chunkCommitted(size) {
                        context.dbObjectsCommitted += size;
                    },
                    commitStarted() {
                        const execRunning = context.execTimer.running;
                        if (execRunning)
                            context.execTimer.end();
                        context.dbTimer.resume();
                        return {
                            [Symbol.dispose]: memoize(() => {
                                context.dbTimer.end();
                                if (execRunning)
                                    context.execTimer.resume();
                            })
                        };
                    }
                },
                this.logger
            ),
            limit: options.limit,
            authorId: options.author,
            authorizerId,
            authorizer,
            authorizerPermissions: authorizerPermissions.has('administrator')
                ? new DiscordPermissions(~0n)
                : new DiscordPermissions(authorizerPermissions.allow),
            prefix: options.prefix,
            isCC: options.isCC,
            silent: options.silent,
            flagDefinitions: options.flagDefinitions,
            functions: new Map(),
            queryCache: {
                count: 0,
                user: new Map(),
                role: new Map(),
                channel: new Map()
            },
            ownedMessageIds: new Set([options.message.id]),
            tagCache: new Map(),
            ccCache: new Map(),
            allowedMentions: {
                users: new Set(),
                roles: new Set(),
                everybody: false
            },
            tagName: options.tagName,
            message: options.message,
            quiet: undefined,
            fallback: undefined,
            noLookupErrors: undefined,
            reason: undefined,
            inLock: false,
            paramsarray: undefined,
            reaction: undefined,
            reactUser: undefined,
            input: toBBTagInput(options.input, options.flagDefinitions),
            cooldown: options.cooldown
        });
        return context;
    }

    public async execute(source: string, options: BBTagRuntimeInput): Promise<ExecutionResult> {
        const { isCC, tagName } = options;
        this.logger.bbtag(`Start running ${isCC ? 'CC' : 'tag'} ${tagName}`);
        const timer = new Timer().start();
        const bbtag = bbtagUtil.parse(source);
        this.logger.bbtag(`Parsed bbtag in ${timer.poll(true)}ms`);
        const context = this.createContext(options);
        this.logger.bbtag(`Created context in ${timer.poll(true)}ms`);
        let content: string;
        const cooldown = this.cooldowns.check({
            guildId: context.root.message.channel.guild.id,
            userId: context.root.message.author.id,
            tagName: context.local.tagName,
            isCC: context.root.isCC,
            cooldownMs: context.local.cooldown
        });
        if (cooldown !== false) {
            const unixTimestamp = Temporal.Instant.fromEpochMilliseconds(0).add(cooldown).epochMilliseconds;
            await OutputSubtag.sendOutput(context, `This ${context.root.isCC ? 'custom command' : 'tag'} is currently under cooldown. Please try again <t:${unixTimestamp}:R>.`);
            content = context.addError(new TagCooldownError(context.local.tagName, context.root.isCC, cooldown));
        } else {
            context.execTimer.start();
            content = await context.eval(bbtag);
            if (context.root.output.replace !== undefined)
                content = content.replace(context.root.output.replace.regex, context.root.output.replace.with);
            context.execTimer.end();
            this.logger.bbtag(`Tag run complete in ${timer.poll(true)}ms`);
            await context.root.variables.persist();
            this.logger.bbtag(`Saved variables in ${timer.poll(true)}ms`);
            await OutputSubtag.sendOutput(context, content);
            this.logger.bbtag(`Sent final output in ${timer.poll(true)}ms`);
        }

        return {
            source,
            tagName: context.root.tagName,
            input: context.root.input.raw,
            content: content,
            debug: context.debug,
            errors: context.errors,
            duration: {
                active: context.execTimer.elapsed,
                database: context.dbTimer.elapsed,
                total: context.execTimer.duration.add(context.dbTimer.duration).asMilliseconds(),
                subtag: context.subtagInvocations
            },
            database: {
                committed: context.dbObjectsCommitted,
                values: context.root.variables.list.reduce<JObject>((v, c) => {
                    if (c.value !== undefined)
                        v[c.key] = c.value;
                    return v;
                }, {})
            },
            loadedSources: [
                ...context.root.tagCache.keys().map(k => `tag_${k}`),
                ...context.root.ccCache.keys().map(k => `cc_${k}`)
            ]
        };
    }

    public serialize(context: BBTagContext): SerializedBBTagContext {
        const { local, root } = context;
        const message = root.message;
        return {
            msg: {
                id: message.id,
                timestamp: message.createdAt,
                content: message.content,
                channel: serializeEntity(message.channel),
                member: serializeEntity(message.member),
                attachments: message.attachments,
                embeds: message.embeds
            },
            isCC: root.isCC,
            scope: {
                functions: Object.fromEntries(root.functions),
                isTag: false,
                inLock: local.inLock,
                fallback: local.fallback,
                noLookupErrors: local.noLookupErrors,
                paramsarray: local.paramsarray?.slice(),
                quiet: local.quiet,
                reaction: local.reaction,
                reactUser: local.reactUser,
                reason: local.reason
            },
            inputRaw: local.input.raw,
            data: {
                allowedMentions: {
                    everybody: root.allowedMentions.everybody,
                    roles: [...root.allowedMentions.roles],
                    users: [...root.allowedMentions.users]
                },
                ownedMsgs: [...root.ownedMessageIds],
                query: {
                    count: root.queryCache.count,
                    channel: Object.fromEntries(root.queryCache.channel),
                    role: Object.fromEntries(root.queryCache.role),
                    user: Object.fromEntries(root.queryCache.user)
                },
                stackSize: root.recursion.depth
            },
            prefix: root.prefix,
            flags: root.flagDefinitions,
            tagName: local.tagName,
            rootTagName: root.variables.scopes.tagName,
            tagVars: root.variables.scopes.isTag,
            author: root.authorId,
            authorizer: root.authorizerId,
            limit: root.limit.serialize(),
            tempVars: context.root.variables.list
                .filter(v => v.key.startsWith('~'))
                .reduce<Record<string, JToken>>((p, v) => {
                    if (v.value !== undefined)
                        p[v.key] = v.value;
                    return p;
                }, {})
        };

        function serializeEntity(entity: { id: string; }): { id: string; serialized: string; }
        function serializeEntity(entity?: { id: string; }): { id: string; serialized: string; } | undefined
        function serializeEntity(entity?: { id: string; }): { id: string; serialized: string; } | undefined {
            if (entity === undefined)
                return undefined;
            return { id: entity.id, serialized: JSON.stringify(entity) };
        }
    }

    public async deserialize(obj: SerializedBBTagContext): Promise<BBTagContext> {
        const message = await this.#getOrFabricateMessage(obj);
        const result = this.createContext({
            author: obj.author,
            authorizer: obj.authorizer ?? obj.author ?? message.channel.guild.id,
            flagDefinitions: obj.flags,
            input: obj.inputRaw,
            isCC: obj.isCC,
            limit: BaseRuntimeLimit.deserialize(obj.limit),
            message: message,
            prefix: obj.prefix,
            silent: false,
            tagName: obj.tagName,
            tagVars: obj.tagVars,
            cooldown: 0
        });
        result.root.queryCache.count = obj.data.query.count;
        Object.entries(obj.data.query.channel).forEach(x => result.root.queryCache.channel.set(...x));
        Object.entries(obj.data.query.role).forEach(x => result.root.queryCache.role.set(...x));
        Object.entries(obj.data.query.user).forEach(x => result.root.queryCache.user.set(...x));
        obj.data.ownedMsgs.forEach(x => result.root.ownedMessageIds.add(x));
        obj.data.allowedMentions.roles.forEach(x => result.root.allowedMentions.roles.add(x));
        obj.data.allowedMentions.users.forEach(x => result.root.allowedMentions.users.add(x));
        result.root.allowedMentions.everybody = obj.data.allowedMentions.everybody;
        result.local.fallback = obj.scope.fallback;
        result.local.quiet = obj.scope.quiet;
        result.local.fallback = obj.scope.fallback;
        result.local.noLookupErrors = obj.scope.noLookupErrors;
        result.local.reason = obj.scope.reason;
        result.local.inLock = obj.scope.inLock;
        result.local.paramsarray = obj.scope.paramsarray;
        result.local.reaction = obj.scope.reaction;
        result.local.reactUser = obj.scope.reactUser;
        Object.entries(obj.scope.functions).forEach(x => result.root.functions.set(...x));
        await Promise.all(Object.entries(obj.tempVars).map(x => result.root.variables.set(...x)));
        return result;
    }

    async #getOrFabricateMessage(obj: SerializedBBTagContext): Promise<BBTagContextMessage> {
        const msg = await this.util.getMessage(obj.msg.channel.id, obj.msg.id);
        if (msg !== undefined) {
            if (guard.isGuildMessage(msg))
                return msg;
            throw new Error('Channel must be a guild channel to work with BBTag');
        }

        const channel = await this.util.getChannel(obj.msg.channel.id);
        if (channel === undefined || !guard.isGuildChannel(channel))
            throw new Error('Channel must be a guild channel to work with BBTag');

        if (!guard.isTextableChannel(channel))
            throw new Error('Channel must be able to send and receive messages to work with BBTag');

        const member = await this.#getOrFabricateMember(channel.guild, obj);
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

    async #getOrFabricateMember(guild: eris.Guild, obj: SerializedBBTagContext): Promise<eris.Member> {
        if (obj.msg.member === undefined)
            throw new Error('No user id given');

        const member = await this.util.getMember(guild, obj.msg.member.id);
        if (member !== undefined)
            return member;

        const user = await this.util.getUser(obj.msg.member.id);
        if (user === undefined)
            throw new Error('No user found');

        return new eris.Member({
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
        }, guild, this.dependencies.discord);
    }

    async #evalStatementScoped(bbtag: BBTagExpression, context: BBTagContext): Promise<string> {
        using _scope = context.enterScope();
        return await joinResults(this.#evalStatement(bbtag, context));
    }

    async * #evalSubtag(bbtag: SubtagCall, context: BBTagContext): AsyncIterable<string> {
        const name = (await this.#evalStatementScoped(bbtag.name, context)).toLowerCase();

        try {
            const subtag = context.getSubtag(name);
            await context.root.limit.check(context, subtag.name);

            using _stack = context.callStack.push(subtag.name, bbtag);

            try {
                for await (const item of subtag.execute(context, name, bbtag)) {
                    // allow the eventloop to process other stuff every 1000 subtag calls
                    if (++context.subtagCount % 1000 === 0)
                        await this.dependencies.sleep(0);

                    if (item !== undefined)
                        yield item;
                }
            } catch (err: unknown) {
                yield err instanceof BBTagRuntimeError
                    ? context.addError(err, bbtag)
                    : this.#logError(context, err, bbtag);
            }

        } catch (err: unknown) {
            if (!(err instanceof BBTagRuntimeError))
                throw err;
            yield context.addError(err, bbtag);
        }

    }

    async * #evalStatement(bbtag: BBTagExpression, context: BBTagContext): AsyncIterable<string> {
        for (const elem of bbtag.values) {
            if (typeof elem === 'string')
                yield elem;
            else {
                yield* this.#evalSubtag(elem, context);
                if (context.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        }
    }

    public async eval(bbtag: SubtagCall | BBTagExpression, context: BBTagContext): Promise<string> {
        if (context.engine !== this)
            throw new Error('Cannot execute a context from another engine!');

        if (context.state !== BBTagRuntimeState.RUNNING)
            return '';

        const results = 'values' in bbtag
            ? this.#evalStatement(bbtag, context)
            : this.#evalSubtag(bbtag, context);

        return await joinResults(results);
    }

    #logError(context: BBTagContext, error: unknown, bbtag: SubtagCall): string {
        if (error instanceof RangeError)
            throw error;

        this.logger.error(error);
        return context.addError(new InternalServerError(error), bbtag);
    }

    public check(source: string): AnalysisResults {
        const result: AnalysisResults = { errors: [], warnings: [] };

        const statement = bbtagUtil.parse(source);

        for (const call of getSubtagCalls(statement)) {
            if (call.name.values.length === 0)
                result.warnings.push({ location: call.start, message: templates.analysis.unnamed });
            else if (guard.every(call.name.values, guard.isTypeOf('string'))) {
                const subtag = this.subtags.get(call.name.values.join(''));
                // TODO Detect unknown subtags
                switch (typeof subtag?.deprecated) {
                    case 'boolean':
                        if (!subtag.deprecated)
                            break;
                    // fallthrough
                    case 'string':
                        result.warnings.push({ location: call.start, message: templates.analysis.deprecated(subtag) });
                }
            } else
                result.warnings.push({ location: call.start, message: templates.analysis.dynamic });
        }

        return result;
    }
}

function* getSubtagCalls(statement: BBTagExpression): IterableIterator<SubtagCall> {
    for (const part of statement.values) {
        if (typeof part === 'string')
            continue;

        yield part;
        yield* getSubtagCalls(part.name);
        for (const arg of part.args)
            yield* getSubtagCalls(arg);
    }
}

async function joinResults(values: AsyncIterable<string>): Promise<string> {
    const results = [];
    for await (const value of values)
        results.push(value);
    return results.join('');
}
