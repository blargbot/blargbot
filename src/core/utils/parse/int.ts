export function int(s: string | number, radix = 10): number {
    if (typeof s === 'number')
        return s;
    if (typeof s !== 'string')
        return NaN;
    return parseInt(s.replace(/[,.](?=.*[,.])/g, '').replace(',', '.'), radix);
}