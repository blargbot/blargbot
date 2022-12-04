import { Timer } from '@blargbot/core/Timer.js';
import { sleep } from '@blargbot/core/utils/index.js';
import type { Database } from '@blargbot/database';
import type { Logger } from '@blargbot/logger';
import type * as Eris from 'eris';
import moment from 'moment-timezone';

import { BBTagContext } from './BBTagContext.js';
import type { BBTagUtilities, InjectionContext } from './BBTagUtilities.js';
import { BBTagRuntimeError, InternalServerError, SubtagStackOverflowError, TagCooldownError } from './errors/index.js';
import type { Statement, SubtagCall } from './language/index.js';
import type { Subtag } from './Subtag.js';
import { TagCooldownManager } from './TagCooldownManager.js';
import templates from './text.js';
import type { AnalysisResults, BBTagContextOptions, ExecutionResult } from './types.js';
import { BBTagRuntimeState } from './types.js';
import { bbtag as bbtagUtil } from './utils/index.js';

export class BBTagEngine {
    readonly #cooldowns: TagCooldownManager;
    public get discord(): Eris.Client { return this.dependencies.discord; }
    public get logger(): Logger { return this.dependencies.logger; }
    public get database(): Database { return this.dependencies.database; }
    public get util(): BBTagUtilities { return this.dependencies.util; }
    public readonly subtags: ReadonlyMap<string, Subtag>;

    public constructor(
        public readonly dependencies: InjectionContext
    ) {
        this.#cooldowns = new TagCooldownManager();
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

    public async execute(source: string, options: BBTagContextOptions): Promise<ExecutionResult>
    public async execute(source: string, options: BBTagContext, caller: SubtagCall): Promise<ExecutionResult>
    public async execute(source: string, options: BBTagContextOptions | BBTagContext, caller?: SubtagCall): Promise<ExecutionResult> {
        this.logger.bbtag(`Start running ${options.isCC ? 'CC' : 'tag'} ${options.rootTagName ?? ''}`);
        const timer = new Timer().start();
        const bbtag = bbtagUtil.parse(source, options instanceof BBTagContext);
        this.logger.bbtag(`Parsed bbtag in ${timer.poll(true)}ms`);
        const context = options instanceof BBTagContext ? options : new BBTagContext(this, { cooldowns: this.#cooldowns, ...options });
        this.logger.bbtag(`Created context in ${timer.poll(true)}ms`);
        let content: string;
        if (context.cooldownEnd.isAfter(moment())) {
            const remaining = moment.duration(context.cooldownEnd.diff(moment()));
            if (context.data.stackSize === 0)
                await context.sendOutput(`This ${context.isCC ? 'custom command' : 'tag'} is currently under cooldown. Please try again <t:${moment().add(remaining).unix()}:R>.`);
            content = context.addError(new TagCooldownError(context.tagName, context.isCC, remaining), caller);
        } else if (context.data.stackSize > 200) {
            context.data.state = BBTagRuntimeState.ABORT;
            content = context.addError(new SubtagStackOverflowError(context.data.stackSize), caller);
        } else {
            context.cooldowns.set(context);
            context.execTimer.start();
            content = await context.withStack(async () => {
                const result = await joinResults(this.#evalStatement(bbtag, context));
                if (context.data.replace !== undefined)
                    return result.replace(context.data.replace.regex, context.data.replace.with);
                return result;
            });
            context.execTimer.end();
            this.logger.bbtag(`Tag run complete in ${timer.poll(true)}ms`);
            if (context.data.stackSize === 0) {
                await context.variables.persist();
                this.logger.bbtag(`Saved variables in ${timer.poll(true)}ms`);
                await context.sendOutput(content);
                this.logger.bbtag(`Sent final output in ${timer.poll(true)}ms`);
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
                total: context.totalDuration.asMilliseconds(),
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

    async * #evalSubtag(bbtag: SubtagCall, context: BBTagContext): AsyncIterable<string> {
        const name = (await context.withScope(() => joinResults(this.#evalStatement(bbtag.name, context)))).toLowerCase();

        try {
            const subtag = context.getSubtag(name);
            await context.limit.check(context, subtag.name);

            context.callStack.push(subtag.name, bbtag);

            try {
                for await (const item of subtag.execute(context, name, bbtag)) {
                    // allow the eventloop to process other stuff every 1000 subtag calls
                    if (++context.data.subtagCount % 1000 === 0)
                        await sleep(0);

                    if (item !== undefined)
                        yield item;
                }
            } catch (err: unknown) {
                yield err instanceof BBTagRuntimeError
                    ? context.addError(err, bbtag)
                    : this.#logError(context, err, bbtag);
            } finally {
                context.callStack.pop();
            }

        } catch (err: unknown) {
            if (!(err instanceof BBTagRuntimeError))
                throw err;
            yield context.addError(err, bbtag);
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

        const statement = bbtagUtil.parse(source);

        for (const call of getSubtagCalls(statement)) {
            if (call.name.values.length === 0)
                result.warnings.push({ location: call.start, message: templates.analysis.unnamed });
            else if (call.name.values.some(p => typeof p !== 'string'))
                result.warnings.push({ location: call.start, message: templates.analysis.dynamic });
            else {
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
