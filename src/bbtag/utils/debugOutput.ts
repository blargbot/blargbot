import { SendContent } from '@blargbot/core/types';
import { codeBlock, humanize } from '@blargbot/core/utils';
import moment from 'moment-timezone';

import { SubtagCall } from '../language';
import { ExecutionResult } from '../types';
import { stringify } from './stringify';

export function createDebugOutput(result: ExecutionResult): SendContent {
    const performance: Record<string, unknown> = {};
    for (const [key, times] of Object.entries(result.duration.subtag)) {
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
                file: JSON.stringify({
                    tagName: result.tagName,
                    userInput: result.input,
                    code: result.source,
                    debug: result.debug.map(e => ({
                        details: e.text,
                        subtag: subtagLocation(e.subtag)
                    })),
                    errors: result.errors.map(e => ({
                        error: e.error.message,
                        details: e.error.detail,
                        subtag: readableSubtag(e.subtag)
                    })),
                    variables: result.database.values,
                    performance: performance
                }, undefined, 2)
            }
        ]
    };
}

function readableSubtag(subtag: SubtagCall | undefined): JObject | undefined {
    return subtag === undefined ? undefined : {
        name: stringify(subtag.name),
        arguments: subtag.args.map(stringify),
        ...subtagLocation(subtag)
    };
}

function subtagLocation(subtag: SubtagCall): JObject {
    return {
        start: `Index ${subtag.start.index}: Line ${subtag.start.line}, column ${subtag.start.column}`,
        end: `Index ${subtag.end.index}: Line ${subtag.end.line}, column ${subtag.end.column}`
    };
}
