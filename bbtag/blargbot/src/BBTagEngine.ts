import { sleep } from '@blargbot/async-tools';
import { markup } from '@blargbot/discord-util';
import { Timer } from '@blargbot/timer';
import moment from 'moment-timezone';

import { BBTagContext } from './BBTagContext.js';
import { BBTagRuntimeError, InternalServerError, SubtagStackOverflowError, TagCooldownError } from './errors/index.js';
import { createBBTagArrayTools, createBBTagJsonTools, createBBTagOperators, smartStringCompare } from './index.js';
import type { InjectionContext } from './InjectionContext.js';
import type { Statement, SubtagCall } from './language/index.js';
import { parseBBTag } from './language/index.js';
import type { BBTagLogger } from './services/BBTagLogger.js';
import type { SubtagInvocationContext } from './services/SubtagInvocationMiddleware.js';
import type { Subtag } from './Subtag.js';
import textTemplates from './text.js';
import type { AnalysisResults, BBTagContextOptions, ExecutionResult } from './types.js';
import { BBTagRuntimeState } from './types.js';
import { BBTagVariableProvider, VariableNameParser } from './variables/Caching.js';
import { tagVariableScopeProviders } from './variables/tagVariableScopeProviders.js';

export class BBTagEngine {
    readonly #callSubtag: (context: SubtagInvocationContext) => AsyncIterable<string | undefined>;

    public readonly dependencies: { [P in keyof InjectionContext]-?: NonNullable<InjectionContext[P]> };
    public readonly variables: BBTagVariableProvider;
    public readonly logger: BBTagLogger;
    public readonly subtags: ReadonlyMap<string, Subtag>;

    public constructor(
        dependencies: InjectionContext
    ) {
        const converter = dependencies.converter;
        const arrayTools = dependencies.arrayTools ?? createBBTagArrayTools({ convertToInt: converter.int });
        this.dependencies = {
            ...dependencies,
            logger: dependencies.logger ?? console,
            converter,
            arrayTools,
            operators: dependencies.operators ?? createBBTagOperators({
                compare: smartStringCompare,
                convertToString: converter.string,
                parseArray: v => arrayTools.deserialize(v)?.v
            }),
            jsonTools: dependencies.jsonTools ?? createBBTagJsonTools({
                convertToInt: converter.int,
                isTagArray: arrayTools.isTagArray
            })
        };
        this.logger = this.dependencies.logger;
        this.#callSubtag = [...dependencies.middleware].reduce<(ctx: SubtagInvocationContext) => AsyncIterable<string | undefined>>(
            (p, c) => (ctx) => c(ctx, p.bind(null, ctx)),
        /**/(ctx) => ctx.subtag.execute(ctx.context, ctx.subtagName, ctx.call)
        );
        this.variables = new BBTagVariableProvider(new VariableNameParser(tagVariableScopeProviders), dependencies.variables);
        const subtags = new Map<string, Subtag>();
        this.subtags = subtags;
        for (const descriptor of dependencies.subtags) {
            const subtag = descriptor.createInstance(this);
            for (const name of BBTagEngine.#subtagNames(subtag)) {
                const current = subtags.get(name);
                if (current !== undefined)
                    throw new Error(`Duplicate subtag with name ${JSON.stringify(descriptor.name)} found`);
                subtags.set(name, subtag);
            }
        }
    }

    static * #subtagNames(subtag: Subtag): Generator<string> {
        yield subtag.name.toLowerCase();
        for (const alias of subtag.aliases)
            yield alias.toLowerCase();
    }

    public async execute(source: string, options: BBTagContextOptions): Promise<ExecutionResult>
    public async execute(source: string, options: BBTagContext, caller: SubtagCall): Promise<ExecutionResult>
    public async execute(source: string, options: BBTagContextOptions | BBTagContext, caller?: SubtagCall): Promise<ExecutionResult> {
        this.logger.info(`Start running ${options.isCC ? 'CC' : 'tag'} ${options.rootTagName ?? ''}`);
        const timer = new Timer().start();
        const bbtag = parseBBTag(source, options instanceof BBTagContext);
        this.logger.info(`Parsed bbtag in ${timer.poll(true)}ms`);
        const context = options instanceof BBTagContext ? options : new BBTagContext(this, options);
        this.logger.info(`Created context in ${timer.poll(true)}ms`);
        let content: string;
        const cooldown = await this.dependencies.cooldown.getCooldown(context, context.isCC ? 'cc' : 'tag', context.tagName, context.cooldown);
        if (moment().isSameOrBefore(cooldown)) {
            const remaining = moment.duration(-moment().diff(cooldown));
            if (context.data.stackSize === 0)
                await context.sendOutput(`This ${context.isCC ? 'custom command' : 'tag'} is currently under cooldown. Please try again ${markup.timestamp.relative(moment().add(remaining).toDate())}.`);
            content = context.addError(new TagCooldownError(context.tagName, context.isCC, remaining), caller);
        } else if (context.data.stackSize > 200) {
            context.data.state = BBTagRuntimeState.ABORT;
            content = context.addError(new SubtagStackOverflowError(context.data.stackSize), caller);
        } else {
            await this.dependencies.cooldown.setCooldown(context, context.isCC ? 'cc' : 'tag', context.tagName);
            context.execTimer.start();
            content = await context.withStack(async () => {
                const result = await joinResults(this.#evalStatement(bbtag, context));
                if (context.data.replace !== undefined)
                    return result.replace(context.data.replace.regex, context.data.replace.with);
                return result;
            });
            context.execTimer.end();
            this.logger.info(`Tag run complete in ${timer.poll(true)}ms`);
            if (context.data.stackSize === 0) {
                await context.variables.persist();
                this.logger.info(`Saved variables in ${timer.poll(true)}ms`);
                await context.sendOutput(content);
                this.logger.info(`Sent final output in ${timer.poll(true)}ms`);
            }
        }

        return {
            source,
            tagName: context.rootTagName,
            input: context.inputRaw,
            content: content,
            debug: context.debug,
            errors: context.errors,
            duration: {
                active: context.execTimer.elapsed,
                database: context.dbTimer.elapsed,
                total: context.totalElapsed,
                subtag: context.data.subtags
            },
            database: {
                committed: context.dbObjectsCommitted,
                values: context.variables.list.reduce<JObject>((v, c) => {
                    if (c.value !== undefined)
                        v[c.key] = c.value;
                    return v;
                }, {})
            },
            loadedSources: Object.keys(context.data.cache)
        };
    }

    async * #evalSubtag(call: SubtagCall, context: BBTagContext): AsyncIterable<string> {
        const subtagName = (await context.withScope(() => joinResults(this.#evalStatement(call.name, context)))).toLowerCase();

        try {
            const subtag = context.getSubtag(subtagName);
            await context.limit.check(context, subtag.name);

            context.callStack.push(subtag.name, call);

            try {
                for await (const item of this.#callSubtag({ subtag, context, subtagName, call })) {
                    // allow the eventloop to process other stuff every 1000 subtag calls
                    if (++context.data.subtagCount % 1000 === 0)
                        await sleep(0);

                    if (item !== undefined)
                        yield item;
                }
            } catch (err: unknown) {
                yield err instanceof BBTagRuntimeError
                    ? context.addError(err, call)
                    : this.#logError(context, err, call);
            } finally {
                context.callStack.pop();
            }

        } catch (err: unknown) {
            if (!(err instanceof BBTagRuntimeError))
                throw err;
            yield context.addError(err, call);
        }

    }

    async * #evalStatement(bbtag: Statement, context: BBTagContext): AsyncIterable<string> {
        for (const elem of bbtag.values) {
            if (typeof elem === 'string')
                yield elem;
            else {
                yield* this.#evalSubtag(elem, context);
                if (context.data.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        }
    }

    public eval(bbtag: SubtagCall | Statement, context: BBTagContext): Awaitable<string> {
        if (context.engine !== this)
            throw new Error('Cannot execute a context from another engine!');

        if (context.data.state !== BBTagRuntimeState.RUNNING)
            return '';

        const results = 'values' in bbtag
            ? context.withScope(() => this.#evalStatement(bbtag, context))
            : this.#evalSubtag(bbtag, context);

        return joinResults(results);
    }

    #logError(context: BBTagContext, error: unknown, bbtag: SubtagCall): string {
        if (error instanceof RangeError)
            throw error;

        this.logger.error(error);
        return context.addError(new InternalServerError(error), bbtag);
    }

    public check(source: string): AnalysisResults {
        const result: AnalysisResults = { errors: [], warnings: [] };

        const statement = parseBBTag(source);

        for (const call of getSubtagCalls(statement)) {
            if (call.name.values.length === 0)
                result.warnings.push({ location: call.start, message: textTemplates.analysis.unnamed });
            else if (call.name.values.some(p => typeof p !== 'string'))
                result.warnings.push({ location: call.start, message: textTemplates.analysis.dynamic });
            else {
                const subtag = this.subtags.get(call.name.values.join(''));
                // TODO Detect unknown subtags
                switch (typeof subtag?.deprecated) {
                    case 'boolean':
                        if (!subtag.deprecated)
                            break;
                    // fallthrough
                    case 'string':
                        result.warnings.push({ location: call.start, message: textTemplates.analysis.deprecated(subtag) });
                }
            }
        }

        return result;
    }
}

function* getSubtagCalls(statement: Statement): IterableIterator<SubtagCall> {
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
