import { Timer } from '@blargbot/core';

import { BBTagContext } from './BBTagContext.js';
import type { InjectionContext } from './BBTagUtilities.js';
import { BBTagRuntimeError, InternalServerError, TagCooldownError } from './errors/index.js';
import type { BBTagExpression, SubtagCall } from './language/index.js';
import { BaseRuntimeLimit } from './limits/BaseRuntimeLimit.js';
import { Subtag } from './Subtag.js';
import { OutputSubtag } from './subtags/index.js';
import { TagCooldownManager } from './TagCooldownManager.js';
import { templates } from './text.js';
import { toBBTagInput } from './toBBTagInput.js';
import type { AnalysisResults, BBTagRuntimeInput, ExecutionResult, SerializedBBTagContext } from './types.js';
import { BBTagRuntimeState } from './types.js';
import { bbtag as bbtagUtil } from './utils/index.js';
import type { VariablesProvider } from './Variables.js';

type SubtagCtor = abstract new (...args: never) => Subtag;
export class BBTagEngine {
    readonly #dependencies: InjectionContext;
    readonly #subtagsByClass: ReadonlyMap<SubtagCtor, Subtag>;
    readonly #subtagsByName: ReadonlyMap<string, Subtag>;
    readonly #subtagInstances: Set<Subtag>;

    public get variables(): VariablesProvider {
        return this.#dependencies.variables;
    }

    public readonly cooldowns: TagCooldownManager;

    public constructor(dependencies: InjectionContext) {
        this.#dependencies = dependencies;
        this.cooldowns = new TagCooldownManager();
        this.#subtagInstances = new Set(dependencies.subtags);
        this.#subtagsByClass = new Map(this.#subtagInstances.values().map(v => {
            if (!(v instanceof Subtag))
                throw new Error(`${String(v)} is not a Subtag`);
            const ctor = v.constructor;
            if (!(v instanceof ctor))
                throw new Error(`Unable to determine the class of ${String(v)}`);
            return [ctor as SubtagCtor, v];
        }));
        const subtags = new Map<string, Subtag>();
        for (const subtag of this.#subtagInstances) {
            for (const name of BBTagEngine.#subtagNames(subtag)) {
                const current = subtags.get(name);
                if (current !== undefined)
                    throw new Error(`Duplicate subtag with name ${JSON.stringify(subtag.name)} found`);
                subtags.set(name, subtag);
            }
        }
        this.#subtagsByName = subtags;
    }

    public get subtags(): readonly Subtag[] {
        return [...this.#subtagInstances];
    }

    public getSubtag<T extends SubtagCtor>(type: T): InstanceType<T>
    public getSubtag(type: string): Subtag | undefined
    public getSubtag(type: SubtagCtor | string): Subtag | undefined {
        if (typeof type !== 'string') {
            const result = this.#subtagsByClass.get(type);
            if (result === undefined)
                throw new Error(`The ${type.name} subtag has not been installed.`);
            return result;
        }
        type = type.toLowerCase();
        return this.#subtagsByName.get(type)
            ?? this.#subtagsByName.get(`${type.split('.', 1)[0]}.`);
    }

    static * #subtagNames(subtag: Subtag): Generator<string> {
        yield subtag.name.toLowerCase();
        for (const alias of subtag.aliases)
            yield alias.toLowerCase();
    }

    public createContext(options: BBTagRuntimeInput): BBTagContext {
        const context = new BBTagContext(this, {
            botId: this.#dependencies.botId,
            guildId: options.guildId,
            messageId: options.messageId,
            channelId: options.channelId,
            userId: options.userId,
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
            limit: options.limit,
            authorId: options.author,
            authorizerId: options.authorizer,
            prefix: options.prefix,
            isCC: options.isCC,
            tagVars: options.tagVars,
            silent: options.silent,
            flagDefinitions: options.flagDefinitions,
            functions: new Map(),
            queryCache: {
                failedQueries: 0,
                user: new Map(),
                role: new Map(),
                channel: new Map()
            },
            ownedMessageIds: new Set([options.messageId]),
            tagCache: new Map(),
            ccCache: new Map(),
            allowedMentions: {
                users: new Set(),
                roles: new Set(),
                everybody: false
            },
            tagName: options.tagName,
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
        this.#dependencies.logger.bbtag(`Start running ${isCC ? 'CC' : 'tag'} ${tagName}`);
        const timer = new Timer().start();
        const bbtag = bbtagUtil.parse(source);
        this.#dependencies.logger.bbtag(`Parsed bbtag in ${timer.poll(true)}ms`);
        const context = this.createContext(options);
        this.#dependencies.logger.bbtag(`Created context in ${timer.poll(true)}ms`);
        let content: string;
        const cooldown = this.cooldowns.check({
            guildId: context.root.guildId,
            userId: context.root.userId,
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
            this.#dependencies.logger.bbtag(`Tag run complete in ${timer.poll(true)}ms`);
            await this.#dependencies.variables.forContext(context).persist();
            this.#dependencies.logger.bbtag(`Saved variables in ${timer.poll(true)}ms`);
            await OutputSubtag.sendOutput(context, content);
            this.#dependencies.logger.bbtag(`Sent final output in ${timer.poll(true)}ms`);
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
                values: this.#dependencies.variables.forContext(context).list.reduce<JObject>((v, c) => {
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
        return {
            msg: {
                id: root.messageId,
                timestamp: 0,
                content: '',
                channel: {
                    id: root.channelId,
                    serialized: JSON.stringify({ id: root.channelId })
                },
                member: {
                    id: root.userId,
                    serialized: JSON.stringify({ id: root.userId })
                },
                attachments: [],
                embeds: []
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
                    count: root.queryCache.failedQueries,
                    channel: Object.fromEntries(root.queryCache.channel),
                    role: Object.fromEntries(root.queryCache.role),
                    user: Object.fromEntries(root.queryCache.user)
                },
                stackSize: root.recursion.depth
            },
            prefix: root.prefix,
            flags: root.flagDefinitions,
            tagName: local.tagName,
            rootTagName: root.tagName,
            tagVars: root.tagVars,
            author: root.authorId,
            authorizer: root.authorizerId,
            limit: root.limit.serialize(),
            tempVars: this.#dependencies.variables.forContext(context).list
                .filter(v => v.key.startsWith('~'))
                .reduce<Record<string, JToken>>((p, v) => {
                    if (v.value !== undefined)
                        p[v.key] = v.value;
                    return p;
                }, {})
        };
    }

    public async deserialize(obj: SerializedBBTagContext): Promise<BBTagContext> {
        const result = this.createContext({
            author: obj.author,
            authorizer: obj.authorizer ?? obj.author ?? this.#dependencies.botId,
            flagDefinitions: obj.flags,
            input: obj.inputRaw,
            isCC: obj.isCC,
            limit: BaseRuntimeLimit.deserialize(obj.limit),
            messageId: obj.msg.id,
            channelId: obj.msg.channel.id,
            userId: obj.msg.member?.id
                ?? await this.#dependencies.util.getMessageAuthor(obj.msg.channel.id, obj.msg.id)
                ?? (() => { throw new Error('No user found'); })(),
            guildId: await this.#dependencies.util.getChannelGuild(obj.msg.channel.id)
                ?? (() => { throw new Error('Channel must be a guild channel to work with BBTag'); })(),
            prefix: obj.prefix,
            silent: false,
            tagName: obj.tagName,
            tagVars: obj.tagVars,
            cooldown: 0
        });
        result.root.queryCache.failedQueries = obj.data.query.count;
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
        const variables = this.#dependencies.variables.forContext(result);
        await Promise.all(Object.entries(obj.tempVars).map(x => variables.set(...x)));
        return result;
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
                        await this.#dependencies.sleep(0);

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

        this.#dependencies.logger.error(error);
        return context.addError(new InternalServerError(error), bbtag);
    }

    public check(source: string): AnalysisResults {
        const result: AnalysisResults = { errors: [], warnings: [] };

        const statement = bbtagUtil.parse(source);

        for (const call of getSubtagCalls(statement)) {
            if (call.name.values.length === 0)
                result.warnings.push({ location: call.start, message: templates.analysis.unnamed });
            else if (call.name.values.every(v => typeof v === 'string')) {
                const subtag = this.#subtagsByName.get(call.name.values.join(''));
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
