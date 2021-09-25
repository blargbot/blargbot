export function float(s: string | number, allowNaN?: true): number;
export function float(s: string | number, allowNaN: true): number | undefined
export function float(s: string | number, allowNaN?: boolean): number | undefined {
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
    return parseFloat(s.replace(/[,.](?=.*[,.])/g, '').replace(',', '.'));
}
