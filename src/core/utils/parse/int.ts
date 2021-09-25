export function int(s: string | number, radix?: number): number;
export function int(s: string | number, allowNaN: false, radix?: number): number | undefined;
export function int(s: string | number, allowNaN: true, radix?: number): number;
export function int(s: string | number, ...args: [boolean, number?] | [number?]): number | undefined {
    const result = intCore(s, args);
    if (!isNaN(result))
        return result;
    if (args[0] === false)
        return undefined;
    return NaN;
}

function intCore(s: string | number, args: [boolean, number?] | [number?]): number {
    if (typeof s === 'number')
        return s;
    if (typeof s !== 'string')
        return NaN;

    let radix = args[args.length - 1];
    if (typeof radix !== 'number') {
        if (s.toLowerCase().startsWith('0x')) {
            radix = 16;
            s = s.substring(2);
        } else {
            radix = 10;
        }
    }

    const result = parseInt(s.replace(/[,.](?=.*[,.])/g, '').replace(',', '.'), radix);
    if (Math.abs(result) > Number.MAX_SAFE_INTEGER)
        return NaN;
    return result;
}
