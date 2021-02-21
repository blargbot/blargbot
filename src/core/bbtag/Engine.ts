import { Client as ErisClient } from 'eris';
import { Cluster, ClusterUtilities } from '../../cluster';
import { bbtagUtil, parse, sleep } from '../../utils';
import { SubtagCall, RuntimeContextOptions, RuntimeReturnState, AnalysisResults } from './types';
import { Statement } from './types';
import { RuntimeContext, SubtagCallback } from './RuntimeContext';
import { BaseSubtagHandler } from './BaseSubtagHandler';
import { Database } from '../database';
import { BBTagError } from './BBTagError';
import { ModuleLoader } from '../ModuleLoader';

export class Engine {
    public get discord(): ErisClient { return this.cluster.discord; }
    public get logger(): CatLogger { return this.cluster.logger; }
    public get database(): Database { return this.cluster.database; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get subtags(): ModuleLoader<BaseSubtagHandler> { return this.cluster.subtags; }

    public constructor(
        public readonly cluster: Cluster
    ) {
    }

    public async execute(source: string, options: RuntimeContextOptions): Promise<string> {
        const bbtag = bbtagUtil.parse(source);
        const context = new RuntimeContext(this, { ...options });
        return await this.eval(bbtag, context);
    }

    public async eval(bbtag: SubtagCall | Statement, context: RuntimeContext): Promise<string> {
        if (context.engine !== this)
            throw new Error('Cannot execute a context from another engine!');

        if (context.state.return !== RuntimeReturnState.NONE)
            return '';

        if (Array.isArray(bbtag)) {
            context.scopes.beginScope();
            const results = await Promise.all(bbtag.map(elem => typeof elem === 'string' ? Promise.resolve(elem) : this.eval(elem, context)));
            context.scopes.finishScope();
            return results.join('');
        }

        // sleep for 100ms every 1000 subtag calls
        if (context.state.subtagCount++ % 1000)
            await sleep(100);

        const name = (await this.eval(bbtag.name, context)).toLowerCase();
        const override = context.state.overrides[name];
        const native = this.cluster.subtags.get(name);
        const [handle, definition]: [SubtagCallback?, BaseSubtagHandler?] =
            override ? [override, undefined]
                : native ? [(subtag, context) => native.execute(subtag, context), native]
                    : [undefined, undefined];

        if (handle === undefined)
            return context.addError(bbtag, `Unknown subtag ${name}`);

        if (definition !== undefined) {
            const result = await context.limit.check(context, bbtag, definition.name);
            if (result !== null)
                return context.addError(bbtag, result);
        }

        try {
            return await handle(bbtag, context);
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
            return context.addError(bbtag, 'An internal server error has occurred');
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