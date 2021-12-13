import { Cluster, ClusterUtilities } from '@cluster';
import { AnalysisResults, BBTagContextOptions, ExecutionResult, RuntimeReturnState, Statement, SubtagCall } from '@cluster/types';
import { bbtagUtil, discordUtil, parse, sleep } from '@cluster/utils';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
import { ModuleLoader } from '@core/modules';
import { Timer } from '@core/Timer';
import { Client as Discord } from 'eris';
import moment from 'moment';
import { inspect } from 'util';

import { BBTagContext } from './BBTagContext';
import { BBTagRuntimeError, InternalServerError, SubtagStackOverflowError, TagCooldownError } from './errors';
import { Subtag } from './Subtag';
import { TagCooldownManager } from './TagCooldownManager';

export class BBTagEngine {
    private readonly cooldowns: TagCooldownManager;
    public get discord(): Discord { return this.cluster.discord; }
    public get logger(): Logger { return this.cluster.logger; }
    public get database(): Database { return this.cluster.database; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get subtags(): ModuleLoader<Subtag> { return this.cluster.subtags; }

    public constructor(
        public readonly cluster: Cluster
    ) {
        this.cooldowns = new TagCooldownManager();
    }

    public async execute(source: string, options: BBTagContextOptions): Promise<ExecutionResult>
    public async execute(source: string, options: BBTagContext, caller: SubtagCall): Promise<ExecutionResult>
    public async execute(source: string, options: BBTagContextOptions | BBTagContext, caller?: SubtagCall): Promise<ExecutionResult> {
        this.logger.bbtag(`Start running ${options.isCC ? 'CC' : 'tag'} ${options.rootTagName ?? ''}`);
        const timer = new Timer().start();
        const bbtag = bbtagUtil.parse(source);
        this.logger.bbtag(`Parsed bbtag in ${timer.poll(true)}ms`);
        const context = options instanceof BBTagContext ? options : new BBTagContext(this, { cooldowns: this.cooldowns, ...options });
        this.logger.bbtag(`Created context in ${timer.poll(true)}ms`);
        let content;
        if (context.cooldownEnd.isAfter(moment())) {
            const remaining = moment.duration(context.cooldownEnd.diff(moment()));
            if (context.state.stackSize === 0)
                await context.sendOutput(`This ${context.isCC ? 'custom command' : 'tag'} is currently under cooldown. Please try again <t:${moment().add(remaining).unix()}:R>.`);
            context.state.return = RuntimeReturnState.ALL;
            content = context.addError(new TagCooldownError(context.tagName, context.isCC, remaining), caller);
        } else if (context.state.stackSize > 200) {
            context.state.return = RuntimeReturnState.ALL;
            content = context.addError(new SubtagStackOverflowError(context.state.stackSize), caller);
        } else {
            context.cooldowns.set(context);
            context.execTimer.start();
            context.state.stackSize++;
            content = await joinResults(this.evalStatement(bbtag, context));
            if (context.state.replace !== undefined)
                content = content.replace(context.state.replace.regex, context.state.replace.with);
            context.state.stackSize--;
            context.execTimer.end();
            this.logger.bbtag(`Tag run complete in ${timer.poll(true)}ms`);
            await context.variables.persist();
            this.logger.bbtag(`Saved variables in ${timer.poll(true)}ms`);
            if (context.state.stackSize === 0) {
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
                subtag: context.state.subtags
            },
            database: {
                committed: context.dbObjectsCommitted,
                values: context.variables.list.reduce<JObject>((v, c) => {
                    if (c.value !== undefined)
                        v[c.key] = c.value;
                    return v;
                }, {})
            }
        };
    }

    private async * evalSubtag(bbtag: SubtagCall, context: BBTagContext): AsyncIterable<string> {
        const name = (await joinResults(this.evalStatement(bbtag.name, context))).toLowerCase();

        try {
            const subtag = context.getSubtag(name);
            await context.limit.check(context, subtag.name);

            context.callStack.push(subtag.name, bbtag);

            try {
                for await (const item of subtag.execute(context, name, bbtag)) {
                    // allow the eventloop to process other stuff every 1000 subtag calls
                    if (++context.state.subtagCount % 1000 === 0)
                        await sleep(0);

                    if (item !== undefined)
                        yield item;
                }
            } catch (err: unknown) {
                yield err instanceof BBTagRuntimeError
                    ? context.addError(err, bbtag)
                    : this.logError(context, err, subtag.name, bbtag);
            } finally {
                context.callStack.pop();
            }

        } catch (err: unknown) {
            if (!(err instanceof BBTagRuntimeError))
                throw err;
            yield context.addError(err, bbtag);
        }

    }

    // eslint-disable-next-line @typescript-eslint/require-await
    private async * evalStatement(bbtag: Statement, context: BBTagContext): AsyncIterable<string> {
        context.scopes.pushScope();
        for (const elem of bbtag) {
            if (typeof elem === 'string')
                yield elem;
            else
                yield* this.evalSubtag(elem, context);
        }
        context.scopes.popScope();
    }

    public eval(bbtag: SubtagCall | Statement, context: BBTagContext): Awaitable<string> {
        if (context.engine !== this)
            throw new Error('Cannot execute a context from another engine!');

        if (context.state.return !== RuntimeReturnState.NONE)
            return '';

        const results = Array.isArray(bbtag)
            ? this.evalStatement(bbtag, context)
            : this.evalSubtag(bbtag, context);

        return joinResults(results);
    }

    private async logError(context: BBTagContext, error: unknown, subtagName: string, bbtag: SubtagCall): Promise<string> {
        if (error instanceof RangeError)
            throw error;

        this.logger.error(error);
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        let description = `${error}`;
        const descLimit = discordUtil.getLimit('embed.description');
        if (description.length > descLimit)
            description = `${description.substring(0, descLimit - 15)}... (truncated)`;

        await this.util.send(this.cluster.config.discord.channels.errorlog, {
            embeds: [
                {
                    title: 'A tag error occurred',
                    description: description,
                    color: parse.color('red'),
                    fields: [
                        { name: 'SubTag', value: subtagName, inline: true },
                        { name: 'Arguments', value: JSON.stringify(bbtag.args.map(bbtagUtil.stringify).map(c => c.length < 100 ? c : `${c.substr(0, 97)}...`)) },
                        { name: 'Tag Name', value: context.rootTagName, inline: true },
                        { name: 'Location', value: `${bbtagUtil.stringifyRange(bbtag)}`, inline: true },
                        { name: 'Channel | Guild', value: `${context.channel.id} | ${context.guild.id}`, inline: true },
                        { name: 'CCommand', value: context.isCC ? 'Yes' : 'No', inline: true }
                    ]
                }
            ],
            files: [
                {
                    file: inspect(error),
                    name: 'error.txt'
                }
            ]
        });
        return context.addError(new InternalServerError(error), bbtag);
    }

    public check(source: string): AnalysisResults {
        const result: AnalysisResults = { errors: [], warnings: [] };

        const statement = bbtagUtil.parse(source);

        for (const call of getSubtagCalls(statement)) {
            if (call.name.length === 0)
                result.warnings.push({ location: call.start, message: 'Unnamed subtag' });
            else if (call.name.some(p => typeof p !== 'string'))
                result.warnings.push({ location: call.start, message: 'Dynamic subtag' });
            else {
                const subtag = this.subtags.get(call.name.join(''));
                // TODO Detect unknown subtags
                switch (typeof subtag?.deprecated) {
                    case 'boolean':
                        if (!subtag.deprecated)
                            break;
                    // fallthrough
                    case 'string':
                        result.warnings.push({ location: call.start, message: `{${subtag.name}} is deprecated. ${subtag.deprecated}` });
                }
            }
        }

        return result;
    }
}

function* getSubtagCalls(statement: Statement): IterableIterator<SubtagCall> {
    for (const part of statement) {
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
