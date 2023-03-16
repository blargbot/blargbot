import { mapping } from '@blargbot/mapping';

import type { BBTagRuntime } from '../BBTagRuntime.js';
import { BBTagRuntimeError, NotANumberError } from '../index.js';
import type { BBTagArray } from '../types.js';

export interface BBTagArrayTools {
    serialize(this: void, array: JArray | BBTagArray, varName?: string): string;
    deserialize(this: void, value: string): BBTagArray | undefined;
    flattenArray(this: void, array: JArray): JArray;
    deserializeOrGetArray(this: void, context: BBTagRuntime, value: string): Promise<BBTagArray | undefined>;
    deserializeOrGetIterable(this: void, context: BBTagRuntime, value: string): Promise<Iterable<JToken> | undefined>;
    isTagArray(this: void, value: unknown): value is BBTagArray;
}

export interface BBTagArrayToolsOptions {
    convertToInt: (value: string) => number | undefined;
}

export function createBBTagArrayTools(options: BBTagArrayToolsOptions): BBTagArrayTools {
    const {
        convertToInt
    } = options;

    const tools: BBTagArrayTools = {
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
            let result = mapBBTagArrayOrJson(value);
            if (!result.valid) {
                result = mapBBTagArrayOrJson(value.replace(
                    /([[,]\s*)(\d+)\s*\.\.\.\s*(\d+)(\s*[\],])/gi,
                    (_, ...[before, fromStr, toStr, after]: string[]) => {
                        const from = convertToInt(fromStr);
                        if (from === undefined)
                            throw new NotANumberError(fromStr);
                        const to = convertToInt(toStr);
                        if (to === undefined)
                            throw new NotANumberError(toStr);
                        const count = Math.abs(from - to);
                        if (count > 200)
                            throw new BBTagRuntimeError('Range cannot be more than 200 numbers long');
                        const step = from < to ? 1 : -1;
                        return `${before}${Array.from({ length: count }, (_, i) => from + step * i).join(',')}${after}`;
                    }
                ));
            }

            if (!result.valid)
                return undefined;
            if (Array.isArray(result.value))
                return { v: result.value };
            return result.value;
        },
        flattenArray(array: JArray): JArray {
            const result = [];
            for (const arg of array) {
                const arr = typeof arg === 'string' ? tools.deserialize(arg) : undefined;
                if (arr !== undefined)
                    result.push(...arr.v);
                else if (Array.isArray(arg))
                    result.push(...arg);
                else
                    result.push(arg);
            }
            return result;
        },
        async deserializeOrGetArray(context: BBTagRuntime, value: string): Promise<BBTagArray | undefined> {
            const obj = tools.deserialize(value);
            if (obj !== undefined)
                return obj;

            const arr = await context.variables.get(value);
            if (Array.isArray(arr.value))
                return { v: arr.value, n: value };

            return undefined;
        },
        async deserializeOrGetIterable(context: BBTagRuntime, value: string): Promise<Iterable<JToken> | undefined> {
            const obj = tools.deserialize(value);
            if (obj !== undefined)
                return obj.v;

            const arr = await context.variables.get(value);
            if (Array.isArray(arr.value) || typeof arr.value === 'string')
                return arr.value;

            return undefined;
        },
        isTagArray(value: unknown): value is BBTagArray {
            return mapBBTagArrayCore(value).valid;
        }
    };
    return tools;
}

const mapBBTagArrayCore = mapping.object<BBTagArray>({
    n: mapping.string.optional,
    v: mapping.array(mapping.jToken)
});

const mapBBTagArrayOrJson = mapping.json(
    mapping.choice(
        mapping.array(mapping.jToken),
        mapBBTagArrayCore
    )
);
