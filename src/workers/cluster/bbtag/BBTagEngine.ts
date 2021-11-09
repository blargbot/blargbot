import { Cluster, ClusterUtilities } from '@cluster';
import { AnalysisResults, BBTagContextOptions, ExecutionResult, RuntimeReturnState, Statement, SubtagCall } from '@cluster/types';
import { bbtagUtil, discordUtil, parse, sleep } from '@cluster/utils';
import { Database } from '@core/database';
import { Logger } from '@core/Logger';
import { ModuleLoader } from '@core/modules';
import { Timer } from '@core/Timer';
import { Client as Discord } from 'discord.js';
import moment from 'moment';
import { inspect } from 'util';

import { BaseSubtag } from './BaseSubtag';
import { BBTagContext } from './BBTagContext';
import { BBTagRuntimeError, SubtagStackOverflowError, TagCooldownError } from './errors';
import { TagCooldownManager } from './TagCooldownManager';

export class BBTagEngine {
    private readonly cooldowns: TagCooldownManager;
    public get discord(): Discord<true> { return this.cluster.discord; }
    public get logger(): Logger { return this.cluster.logger; }
    public get database(): Database { return this.cluster.database; }
    public get util(): ClusterUtilities { return this.cluster.util; }
    public get subtags(): ModuleLoader<BaseSubtag> { return this.cluster.subtags; }

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
            content = await this.evalStatement(bbtag, context);
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
                values: context.variables.list.reduce<Record<string, JToken>>((v, c) => {
                    v[c.key] = c.value;
                    return v;
                }, {})
            }
        };
    }

    private async evalSubtag(bbtag: SubtagCall, context: BBTagContext): Promise<string> {
        const name = (await this.evalStatement(bbtag.name, context)).toLowerCase();

        try {
            const subtag = context.getSubtag(name);
            await context.limit.check(context, bbtag, subtag.name);
            context.callStack.push(subtag.name, bbtag);

            try {

                // sleep for 100ms every 1000 subtag calls
                if (++context.state.subtagCount % 1000 === 0)
                    await sleep(10);
                return await subtag.execute(context, name, bbtag) ?? '';
            } catch (err: unknown) {
                if (!(err instanceof BBTagRuntimeError))
                    return this.logError(context, err, subtag.name, bbtag);
                throw err;
            } finally {
                context.callStack.pop();
            }

        } catch (err: unknown) {
            if (err instanceof BBTagRuntimeError)
                return context.addError(err, bbtag);
            throw err;
        }
    }

    private async evalStatement(bbtag: Statement, context: BBTagContext): Promise<string> {
        const results = [];
        context.scopes.pushScope();
        for (const elem of bbtag) {
            if (typeof elem === 'string')
                results.push(elem);
            else
                results.push(await this.evalSubtag(elem, context));
        }
        context.scopes.popScope();
        return results.join('');
    }

    public eval(bbtag: SubtagCall | Statement, context: BBTagContext): Awaitable<string> {
        if (context.engine !== this)
            throw new Error('Cannot execute a context from another engine!');

        if (context.state.return !== RuntimeReturnState.NONE)
            return '';

        return Array.isArray(bbtag)
            ? this.evalStatement(bbtag, context)
            : this.evalSubtag(bbtag, context);
    }

    private async logError(context: BBTagContext, error: unknown, subtagName: string, bbtag: SubtagCall): Promise<string> {
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
                    attachment: inspect(error),
                    name: 'error.txt'
                }
            ]
        });
        const bbError = new BBTagRuntimeError('An internal server error has occurred', error instanceof Error ? error.message : undefined);
        return context.addError(bbError, bbtag);
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
