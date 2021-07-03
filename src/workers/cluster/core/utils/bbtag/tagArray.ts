import { BBTagContext } from '../../bbtag';
import { getRange, mapping } from '../../globalCore';
import { BBTagArray, SubtagCall } from '../../types';
import { parse } from '../parse';

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
    mapping.choose(
        mapping.array(mapping.jToken),
        mapping.object<BBTagArray>({
            n: mapping.optionalString,
            v: mapping.array(mapping.jToken)
        })
    )
);

export function flattenArray(array: JArray): JArray {
    const result = [];
    for (const arg of array) {
        const arr = typeof arg === 'string' ? deserialize(arg) : { v: arg };
        if (arr !== undefined && Array.isArray(arr.v))
            result.push(...arr.v);
        else result.push(arg);
    }
    return result;
}

export async function getArray(context: BBTagContext, subtag: SubtagCall, arrName: string): Promise<BBTagArray | undefined> {
    const obj = deserialize(arrName);
    if (obj !== undefined)
        return obj;
    try {
        const arr = await context.variables.get(arrName, subtag);
        if (arr !== undefined && Array.isArray(arr))
            return { v: arr, n: arrName };
    } catch {
        // NOOP
    }
    return undefined;
}
