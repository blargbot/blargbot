export function float(s: string | number): number {
    if (typeof s === 'number')
        return s;
    return parseFloat(s.replace(/[,\.](?=.*[,\.])/g, '').replace(',', '.'));
}