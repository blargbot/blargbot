export interface ParseIntOptions {
    readonly radix?: number;
    readonly strict?: boolean;
}

export function parseInt(s: string | number, options: ParseIntOptions = {}): number | undefined {
    const result = intCore(s, options);
    if (isNaN(result))
        return undefined;
    return result;
}

function intCore(s: string | number, options: ParseIntOptions): number {
    if (typeof s === 'number')
        return s;
    if (typeof s !== 'string')
        return NaN;

    let radix = options.radix;
    if (radix === undefined) {
        if (s.toLowerCase().startsWith('0x')) {
            radix = 16;
            s = s.substring(2);
        } else {
            radix = 10;
        }
    }

    s = s.replace(/[,.](?=.*[,.])/g, '').replace(',', '.');
    if (options.strict === true && radixRegexes[radix]?.test(s) === false)
        return NaN;

    return global.parseInt(s, radix);
}

const charset = '0123456789abcdefghijklmnopqrstuvwxyz0';
const radixRegexes = charset
    .split('')
    .map((_, i) => new RegExp(`^[${charset.slice(0, i)}]+$`, 'i'));
