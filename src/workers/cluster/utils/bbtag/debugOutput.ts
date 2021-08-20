import { ExecutionResult } from '@cluster/types';
import { codeBlock, humanize } from '@core/utils';
import { MessageOptions } from 'discord.js';
import moment from 'moment';

import { bbtagUtil } from '.';

export function createDebugOutput(result: ExecutionResult): MessageOptions {
    const performance: Record<string, unknown> = {};
    for (const key of Object.keys(result.duration.subtag)) {
        const times = result.duration.subtag[key];
        if (times !== undefined && times.length > 0) {
            const totalTime = times.reduce((l, r) => l + r);
            performance[key] = {
                count: times.length,
                totalMs: totalTime,
                averageMs: totalTime / times.length
            };
        }
    }

    return {
        content: codeBlock(
            `         Execution Time: ${humanize.duration(moment.duration(result.duration.active, 'ms'))}\n` +
            `    Variables Committed: ${result.database.committed}\n` +
            `Database Execution Time: ${humanize.duration(moment.duration(result.duration.database, 'ms'))}\n` +
            `   Total Execution Time: ${humanize.duration(moment.duration(result.duration.total, 'ms'))}`,
            'js'),
        files: [
            {
                name: 'bbtag.debug.json',
                attachment: JSON.stringify({
                    tagName: result.tagName,
                    userInput: result.input,
                    code: result.source,
                    debug: result.debug,
                    errors: result.errors.map(e => ({
                        error: e.error,
                        details: e.debugMessage,
                        subtag: e.subtag === undefined ? undefined : {
                            name: bbtagUtil.stringify(e.subtag.name),
                            arguments: e.subtag.args.map(bbtagUtil.stringify),
                            start: `Index ${e.subtag.start.index}: Line ${e.subtag.start.line}, column ${e.subtag.start.column}`,
                            end: `Index ${e.subtag.end.index}: Line ${e.subtag.end.line}, column ${e.subtag.end.column}`
                        }
                    })),
                    variables: result.database.values,
                    performance: performance
                }, undefined, 2)
            }
        ]
    };
}
