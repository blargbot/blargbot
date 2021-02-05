export function int(s: string | number, radix = 10) {
    if (typeof s === 'number')
        return s;
    return parseInt(s.replace(/[,\.](?=.*[,\.])/g, '').replace(',', '.'), radix);
}