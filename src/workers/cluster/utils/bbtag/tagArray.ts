import { BBTagContext } from '@cluster/bbtag';
import { BBTagArray } from '@cluster/types';
import { getRange, mapping, parse } from '@core/utils';

export function serialize(array: JArray | BBTagArray, varName?: string): string {
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
}

export function deserialize(value: string): BBTagArray | undefined {
    let result = mapBBArray(value);
    if (!result.valid) {
        value = value.replace(
            /([[,]\s*)(\d+)\s*\.\.\.\s*(\d+)(\s*[\],])/gi,
            (_, ...[before, from, to, after]: string[]) =>
                before + getRange(parse.int(from), parse.int(to)).join(',') + after);
        result = mapBBArray(value);
    }

    if (!result.valid)
        return undefined;
    if (Array.isArray(result.value))
        return { v: result.value };
    return result.value;
}

const mapBBArray = mapping.json(
    mapping.choice(
        mapping.array(mapping.jToken),
        mapping.object<BBTagArray>({
            n: mapping.string.optional,
            v: mapping.array(mapping.jToken)
        })
    )
);

export function flattenArray(array: JArray): JArray {
    const result = [];
    for (const arg of array) {
        const arr = typeof arg === 'string' ? deserialize(arg) : undefined;
        if (arr !== undefined)
            result.push(...arr.v);
        else if (Array.isArray(arg))
            result.push(...arg);
        else
            result.push(arg);
    }
    return result;
}

export async function deserializeOrGetArray(context: BBTagContext, value: string): Promise<BBTagArray | undefined> {
    const obj = deserialize(value);
    if (obj !== undefined)
        return obj;

    const arr = await context.variables.get(value);
    if (Array.isArray(arr.value))
        return { v: arr.value, n: value };

    return undefined;
}

export async function deserializeOrGetIterable(context: BBTagContext, value: string): Promise<Iterable<JToken> | undefined> {
    const obj = deserialize(value);
    if (obj !== undefined)
        return obj.v;

    const arr = await context.variables.get(value);
    if (Array.isArray(arr.value) || typeof arr.value === 'string')
        return arr.value;

    return undefined;
}
