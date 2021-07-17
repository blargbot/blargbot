import { Cluster, ClusterUtilities } from '@cluster';
import { AnalysisResults, BBTagContextOptions, ExecutionResult, RuntimeReturnState, Statement, SubtagCall, SubtagHandler } from '@cluster/types';
import { bbtagUtil, parse, sleep } from '@cluster/utils';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
import { ModuleLoader } from '@core/modules';
import { Timer } from '@core/Timer';
import { Client as ErisClient } from 'eris';

import { BaseSubtag } from './BaseSubtag';
import { BBTagContext } from './BBTagContext';
import { BBTagError } from './BBTagError';

export class BBTagEngine {
    public get discord(): ErisClient { return this.cluster.discord; }
    public get logger(): Logger { return this.cluster.logger; }
    public get database(): Database { return this.cluster.database; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get subtags(): ModuleLoader<BaseSubtag> { return this.cluster.subtags; }

    public constructor(
        public readonly cluster: Cluster
    ) {
    }

    public async execute(source: string, options: BBTagContextOptions): Promise<ExecutionResult> {
        this.logger.bbtag(`Start running ${options.isCC ? 'CC' : 'tag'} ${options.tagName ?? ''}`);
        const timer = new Timer().start();
        const bbtag = bbtagUtil.parse(source);
        this.logger.bbtag(`Parsed bbtag in ${timer.poll(true)}ms`);
        const context = new BBTagContext(this, { ...options });
        this.logger.bbtag(`Created context in ${timer.poll(true)}ms`);
        context.execTimer.start();
        const content = await this.eval(bbtag, context);
        context.execTimer.end();
        this.logger.bbtag(`Tag run complete in ${timer.poll(true)}ms`);
        await context.variables.persist();
        this.logger.bbtag(`Saved variables in ${timer.poll(true)}ms`);
        await context.sendOutput(content);
        this.logger.bbtag(`Sent final output in ${timer.poll(true)}ms`);
        return {
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
                values: context.variables.list.reduce<Record<string, JToken>>((v, c) => {
                    v[c.key] = c.value;
                    return v;
                }, {})
            }
        };
    }

    public async eval(bbtag: SubtagCall | Statement, context: BBTagContext): Promise<string> {
        if (context.engine !== this)
            throw new Error('Cannot execute a context from another engine!');

        if (context.state.return !== RuntimeReturnState.NONE)
            return '';

        if (!('name' in bbtag)) {
            const results = [];
            context.scopes.beginScope();
            for (const elem of bbtag)
                results.push(typeof elem === 'string' ? elem : await this.eval(elem, context));
            context.scopes.finishScope();
            return results.join('');
        }

        const name = (await this.eval(bbtag.name, context)).toLowerCase();
        const override = context.state.overrides[name];
        const native = this.cluster.subtags.get(name);
        const [handler, definition]: [SubtagHandler?, BaseSubtag?] =
            override !== undefined ? [override, undefined]
                : native !== undefined ? [native, native]
                    : [undefined, undefined];

        if (handler === undefined)
            return context.addError(`Unknown subtag ${name}`, bbtag);

        if (definition !== undefined) {
            const result = await context.limit.check(context, bbtag, definition.name);
            if (result !== undefined)
                return context.addError(result, bbtag);
        }

        try {
            // sleep for 100ms every 1000 subtag calls
            if (++context.state.subtagCount % 1000 === 0)
                await sleep(100);
            const result = await handler.execute(context, name, bbtag);
            return typeof result === 'string' ? result : '';
        } catch (err: unknown) {
            this.logger.error(err);
            await this.util.send(this.cluster.config.discord.channels.errorlog, {
                content: 'A tag error occurred.',
                embed: {
                    title: err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err),
                    description: err instanceof Error ? err.stack : 'No error stack!',
                    color: parse.color('red'),
                    fields: [
                        { name: 'SubTag', value: definition?.name ?? name, inline: true },
                        { name: 'Arguments', value: JSON.stringify(bbtag.args.map(bbtagUtil.stringify).map(c => c.length < 100 ? c : `${c.substr(0, 97)}...`)) },
                        { name: 'Tag Name', value: context.tagName, inline: true },
                        { name: 'Location', value: `${bbtagUtil.stringifyRange(bbtag)}`, inline: true },
                        { name: 'Channel | Guild', value: `${context.channel.id} | ${context.guild.id}`, inline: true },
                        { name: 'CCommand', value: context.isCC ? 'Yes' : 'No', inline: true }
                    ]
                }
            });
            return context.addError('An internal server error has occurred', bbtag, err instanceof Error ? err.message : undefined);
        }
    }

    public check(source: string): AnalysisResults {
        const result: AnalysisResults = { errors: [], warnings: [] };

        try {
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

        } catch (err: unknown) {
            if (err instanceof BBTagError)
                result.errors.push(err);
            else
                throw err;
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
