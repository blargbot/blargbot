import { BBTagContext } from '@blargbot/cluster/bbtag';
import { BBTagArray } from '@blargbot/cluster/types';
import { getRange, mapping, parse } from '@blargbot/core/utils';

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
        let result = mapBBTagArrayOrJson(value);
        if (!result.valid) {
            value = value.replace(
                /([[,]\s*)(\d+)\s*\.\.\.\s*(\d+)(\s*[\],])/gi,
                (_, ...[before, from, to, after]: string[]) =>
                    before + getRange(parse.int(from), parse.int(to)).join(',') + after);
            result = mapBBTagArrayOrJson(value);
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
        return mapBBTagArrayCore(value).valid;
    }
});

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
