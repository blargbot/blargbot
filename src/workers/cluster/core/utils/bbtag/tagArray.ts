import { BBTagContext } from '../../bbtag';
import { getRange } from '../../globalCore';
import { BBTagArray, SubtagCall } from '../../types';
import { parse } from '../parse';

export function serialize(array: JArray | BBTagArray, varName?: string): string {
    if (Array.isArray(array)) {
        if (!varName)
            return JSON.stringify(array);
        return JSON.stringify({ n: varName, v: array });
    }

    if (!varName)
        return JSON.stringify(array);
    return JSON.stringify({
        v: 'v' in array ? array.v : undefined,
        n: varName
    });
}

export function deserialize(value: string): BBTagArray | null {
    let parsed;
    try {
        parsed = JSON.parse(value);
    }
    catch (err) { }
    if (!parsed) {
        try {
            const replaced = value.replace(
                /([\[,]\s*)(\d+)\s*\.\.\.\s*(\d+)(\s*[\],])/gi,
                (_, ...[before, from, to, after]: string[]) =>
                    before + getRange(parse.int(from), parse.int(to)).join(',') + after);
            parsed = JSON.parse(replaced);
        }
        catch (err) { }
    }
    if (Array.isArray(parsed)) {
        return { v: parsed };
    }
    if (typeof parsed === 'object') {
        const { n, v } = parsed;
        if (typeof n === 'string' && Array.isArray(v)) {
            return { n, v };
        }
    }
    return null;
}

export function flattenArray(array: JArray): JArray {
    const result = [];
    for (const arg of array) {
        const arr = typeof arg === 'string' ? deserialize(arg) : { v: arg };
        if (arr != null && Array.isArray(arr.v))
            result.push(...arr.v);
        else result.push(arg);
    }
    return result;
}

export async function getArray(context: BBTagContext, subtag: SubtagCall, arrName: string): Promise<BBTagArray | undefined> {
    const obj = deserialize(arrName);
    if (obj != null)
        return obj;
    try {
        const arr = await context.variables.get(arrName, subtag);
        if (arr !== undefined && Array.isArray(arr))
            return { v: arr, n: arrName };
    } catch (err) { }
    return undefined;
}