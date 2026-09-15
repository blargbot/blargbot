import { parse, zodStringToJson } from '@blargbot/core';
import { Iterable } from '@blargbot/util';
import z from 'zod';

import type { BBTagContext } from '../BBTagContext.js';
import type { BBTagArray } from '../types.js';

export const tagArray = Object.freeze({
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
        let result = mapBBTagArrayOrJson.safeParse(value);
        if (!result.success) {
            value = value.replace(
                /([[,]\s*)(\d+)\s*\.\.\.\s*(\d+)(\s*[\],])/gi,
                (_, ...[before, from, to, after]: string[]) => {
                    const start = parse.int(from) ?? NaN;
                    const end = parse.int(to) ?? NaN;
                    return before + Iterable.range(start, end - start).take(200).toArray().join(',') + after;
                }
            );
            result = mapBBTagArrayOrJson.safeParse(value);
        }

        if (!result.success)
            return undefined;
        if (Array.isArray(result.data))
            return { v: result.data };
        return result.data;
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
    async deserializeOrGetArray(context: BBTagContext, value: string): Promise<BBTagArray | undefined> {
        const obj = this.deserialize(value);
        if (obj !== undefined)
            return obj;

        const arr = await context.variables.get(value);
        if (Array.isArray(arr.value))
            return { v: arr.value, n: value };

        return undefined;
    },
    async deserializeOrGetIterable(context: BBTagContext, value: string): Promise<Iterable<JToken> | undefined> {
        const obj = this.deserialize(value);
        if (obj !== undefined)
            return obj.v;

        const arr = await context.variables.get(value);
        if (Array.isArray(arr.value) || typeof arr.value === 'string')
            return arr.value;

        return undefined;
    },
    isTagArray(value: unknown): value is BBTagArray {
        return mapBBTagArrayCore.safeParse(value).success;
    }
});

const mapBBTagArrayCore = z.object({
    n: z.string().optional(),
    v: z.json().array()
});

const mapBBTagArrayOrJson = zodStringToJson.pipe(z.union([
    z.json().array(),
    mapBBTagArrayCore
]));
