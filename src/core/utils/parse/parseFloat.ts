const parseFloatOld = parseFloat;

export function parseFloat(s: string | number, allowNaN?: true): number;
export function parseFloat(s: string | number, allowNaN: false): number | undefined
export function parseFloat(s: string | number, allowNaN?: boolean): number | undefined {
    const result = floatCore(s);
    if (!isNaN(result))
        return result;
    if (allowNaN === false)
        return undefined;
    return NaN;

}

function floatCore(s: string | number): number {
    if (typeof s === 'number')
        return s;
    return parseFloatOld(s.replace(/[,.](?=.*[,.])/g, '').replace(',', '.'));
}
