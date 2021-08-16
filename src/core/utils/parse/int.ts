export function int(s: string | number, radix?: number): number {
    if (typeof s === 'number')
        return s;
    if (typeof s !== 'string')
        return NaN;

    if (radix === undefined) {
        if (s.toLowerCase().startsWith('0x')) {
            radix = 16;
            s = s.substring(2);
        } else {
            radix = 10;
        }
    }

    return parseInt(s.replace(/[,.](?=.*[,.])/g, '').replace(',', '.'), radix);
}
