import type { ExecutionResult, SubtagCall } from '@bbtag/blargbot';
import { stringify, textTemplates } from '@bbtag/blargbot';
import type { IFormattable } from '@blargbot/formatting';
import type * as Eris from 'eris';

export function bbtagDebugOutput(result: ExecutionResult): { content: IFormattable<string>; file: Eris.FileContent[]; } {
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
        content: textTemplates.debug.summary({
            active: result.duration.active,
            committed: result.database.committed,
            database: result.duration.database,
            total: result.duration.total
        }),
        file: [
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
