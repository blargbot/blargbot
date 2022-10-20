import { TranslatableString } from '@blargbot/domain/messages/TranslatableString';
import { IFormattable } from '@blargbot/domain/messages/types';
import { FileContent } from 'eris';

import { SubtagCall } from '../language';
import { ExecutionResult } from '../types';
import { stringify } from './stringify';

const content = TranslatableString.define<{ active: number; committed: number; database: number; total: number; }>('bbtag.debug.summary', `\`\`\`js
         Execution Time: {active#duration(MS)}ms
    Variables Committed: {committed}
Database Execution Time: {database#duration(MS)}ms
   Total Execution Time: {total#duration(MS)}ms
\`\`\``);

export function createDebugOutput(result: ExecutionResult): { content: IFormattable<string>; files: FileContent[]; } {
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
        content: content({
            active: result.duration.active,
            committed: result.database.committed,
            database: result.duration.database,
            total: result.duration.total
        }),
        files: [
            {
                name: 'bbtag.debug.json',
                file: JSON.stringify({
                    tagName: result.tagName,
                    userInput: result.input,
                    code: result.source,
                    loadedSources: result.loadedSources,
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
