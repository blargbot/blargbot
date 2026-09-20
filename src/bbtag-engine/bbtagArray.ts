import type { BBTagContext } from './BBTagContext.js';
import { parse } from './parse.js';
import type { VariablesLocals } from './replacers/locals.js';
import type { BBTagArray } from './types.js';

export const bbtagArray = Object.freeze({
    serialize(array: JArray | BBTagArray, varName?: string): string {
        if (Array.isArray(array)) {
            if (varName === undefined || varName.length === 0)
                return JSON.stringify(array);
            return JSON.stringify({ n: varName, v: array });
        }

        if (varName === undefined || varName.length === 0)
            return JSON.stringify(array);
        return JSON.stringify({
            v: 'v' in array ? array.v : undefined,
            n: varName
        });
    },
    deserialize(value: string): BBTagArray | undefined {
        let result = tryParseAsBBTagArray(value);
        if (result === undefined) {
            value = value.replace(
                /([[,]\s*)(\d+)\s*\.\.\.\s*(\d+)(\s*[\],])/gi,
                (_, ...[before, from, to, after]: string[]) => {
                    const start = parse.int(from) ?? NaN;
                    const end = parse.int(to) ?? NaN;
                    const count = Math.max(0, Math.min(end - start, 200));
                    return before + Array.from({ length: count }, (_, i) => i + start).join(',') + after;
                }
            );
            result = tryParseAsBBTagArray(value);
        }

        return result;
    },
    flattenArray(array: JArray): JArray {
        const result = [];
        for (const arg of array) {
            const arr = typeof arg === 'string' ? this.deserialize(arg) : undefined;
            if (arr !== undefined)
                result.push(...arr.v);
            else if (Array.isArray(arg))
                result.push(...arg);
            else
                result.push(arg);
        }
        return result;
    },
    async deserializeOrGetArray(context: BBTagContext<VariablesLocals>, value: string): Promise<BBTagArray | undefined> {
        const obj = this.deserialize(value);
        if (obj !== undefined)
            return obj;

        const arr = await context.locals.variables.get(value);
        if (Array.isArray(arr))
            return { v: arr, n: value };

        return undefined;
    },
    async deserializeOrGetIterable(context: BBTagContext<VariablesLocals>, value: string): Promise<Iterable<JToken> | undefined> {
        const obj = this.deserialize(value);
        if (obj !== undefined)
            return obj.v;

        const arr = await context.locals.variables.get(value);
        if (Array.isArray(arr) || typeof arr === 'string')
            return arr;

        return undefined;
    },
    isTagArray(value: unknown): value is BBTagArray {
        return typeof value === 'object'
            && value !== null
            && 'v' in value
            && Array.isArray(value.v)
            && (!('n' in value) || typeof value.n === 'string');
    }
});

function tryParseAsBBTagArray(json: string): BBTagArray | undefined {
    try {
        const result = JSON.parse(json);
        if (bbtagArray.isTagArray(result))
            return result;
        if (Array.isArray(result))
            return { v: result };
        return undefined;
    } catch {
        return undefined;
    }
}
