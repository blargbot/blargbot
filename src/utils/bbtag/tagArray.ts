import { getRange } from '../misc/getRange';

export type BBArray = { n?: string, v: JArray };

export function serialize(array: JArray | BBArray, varName?: string): string {
    if (Array.isArray(array)) {
        if (!varName)
            return JSON.stringify(array);
        return JSON.stringify({ n: varName, v: array });
    }

    if (!varName)
        return JSON.stringify(array);
    return JSON.stringify({
        v: array.v,
        n: varName
    });
}

export function deserialize(value: string): BBArray | null {
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
                    before + getRange(from, to).join(',') + after);
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