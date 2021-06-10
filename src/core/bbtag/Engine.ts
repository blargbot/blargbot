import { Client as ErisClient } from 'eris';
import { Cluster, ClusterUtilities } from '../../cluster';
import { bbtagUtil, parse, sleep } from '../../utils';
import { SubtagCall, BBTagContextOptions, RuntimeReturnState, AnalysisResults, ExecutionResult, SubtagHandler } from './types';
import { Statement } from './types';
import { BBTagContext } from './BBTagContext';
import { BaseSubtag } from './BaseSubtag';
import { Database } from '../database';
import { BBTagError } from './BBTagError';
import { ModuleLoader } from '../ModuleLoader';
import { Timer } from '../../structures/Timer';

export class Engine {
    public get discord(): ErisClient { return this.cluster.discord; }
    public get logger(): CatLogger { return this.cluster.logger; }
    public get database(): Database { return this.cluster.database; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get subtags(): ModuleLoader<BaseSubtag> { return this.cluster.subtags; }

    public constructor(
        public readonly cluster: Cluster
    ) {
    }

    public async execute(source: string, options: BBTagContextOptions): Promise<ExecutionResult> {
        this.logger.bbtag(`Start running ${options.isCC ? 'CC' : 'tag'} ${options.tagName}`);
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
                values: context.variables.list.reduce((v, c) => (v[c.key] = c.value, v), <Record<string, string | undefined>>{})
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
            override ? [override, undefined]
                : native ? [native, native]
                    : [undefined, undefined];

        if (handler === undefined)
            return context.addError(`Unknown subtag ${name}`, bbtag);

        if (definition !== undefined) {
            const result = await context.limit.check(context, bbtag, definition.name);
            if (result !== null)
                return context.addError(result, bbtag);
        }

        try {
            // sleep for 100ms every 1000 subtag calls
            if (++context.state.subtagCount % 1000 === 0)
                await sleep(100);
            const result = await handler.execute(context, bbtag);
            return typeof result === 'string' ? result : '';
        } catch (err) {
            this.logger.error(err);
            await this.util.send(this.cluster.config.discord.channels.errorlog, {
                content: 'A tag error occurred.',
                embed: {
                    title: err.message || (typeof err == 'string' ? err : JSON.stringify(err)),
                    description: err.stack || 'No error stack!',
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
            return context.addError('An internal server error has occurred', bbtag);
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
                    if (subtag?.deprecated) {
                        result.warnings.push({ location: call.start, message: `{${subtag.name}} is deprecated. ${subtag.deprecated}` });
                    }

                }
            }

        } catch (err) {
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