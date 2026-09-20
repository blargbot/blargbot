import { NotABooleanError, NotANumberError } from './BBTagRuntimeError.js';

export interface ParseIntOptions {
    readonly radix?: number;
    readonly strict?: boolean;
    readonly throw?: boolean;
    readonly fallback?: number;
}
export interface ParseFloatOptions {
    readonly strict?: boolean;
    readonly throw?: boolean;
    readonly fallback?: number;
}
export interface ParseBooleanOptions {
    readonly includeNumbers?: boolean;
    readonly throw?: boolean;
    readonly fallback?: boolean;
}

export const parse = {
    int: parseInt,
    float: parseFloat,
    boolean: parseBoolean,
    string: parseString
};

function parseInt(s: JToken | undefined, options: ParseIntOptions & { throw: true; }): number
function parseInt(s: JToken | undefined, options?: ParseIntOptions): number | undefined;
function parseInt(s: JToken | undefined, options: ParseIntOptions = {}): number | undefined {
    const result = parseIntCore(s, options);
    if (!isNaN(result))
        return result;
    if (options.fallback !== undefined)
        return options.fallback;
    if (options.throw === true)
        throw new NotANumberError(s);
    return undefined;
}

function parseIntCore(s: JToken | undefined, options: ParseIntOptions): number {
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
    .map((_, i) => new RegExp(`^[+-]?[${charset.slice(0, i)}]+$`, 'i'));

function parseFloat(s: JToken | undefined, options: ParseFloatOptions & { throw: true; }): number
function parseFloat(s: JToken | undefined, options?: ParseFloatOptions): number | undefined;
function parseFloat(s: JToken | undefined, options: ParseFloatOptions = {}): number | undefined {
    const result = parseFloatCore(s, options);
    if (!isNaN(result))
        return result;
    if (options.fallback !== undefined)
        return options.fallback;
    if (options.throw === true)
        throw new NotANumberError(s);
    return undefined;
}

function parseFloatCore(s: JToken | undefined, options: ParseFloatOptions): number {
    if (typeof s === 'number')
        return s;
    if (typeof s !== 'string')
        return NaN;

    s = s.replace(/[,.](?=.*[,.])/g, '').replace(',', '.');
    if (options.strict === true && !floatTest.test(s))
        return NaN;

    return global.parseFloat(s);
}

const floatTest = /^[+-]?\d+(?:\.\d+)?$/;

function parseBoolean(value: JToken | undefined, options: ParseBooleanOptions & { throw: true; }): boolean
function parseBoolean(value: JToken | undefined, options?: ParseBooleanOptions): boolean | undefined;
function parseBoolean(value: JToken | undefined, options: ParseBooleanOptions = {}): boolean | undefined {
    const result = parseBooleanCore(value, options);
    if (result !== undefined)
        return result;
    if (options.fallback !== undefined)
        return options.fallback;
    if (options.throw === true)
        throw new NotABooleanError(value);
    return undefined;
}
function parseBooleanCore(value: JToken | undefined, options: ParseBooleanOptions): boolean | undefined {
    if (typeof value === 'boolean')
        return value;

    if (options.includeNumbers !== false && typeof value === 'number')
        return value !== 0;

    if (typeof value !== 'string') {
        return undefined;
    }

    if (options.includeNumbers !== false) {
        const asNum = globalThis.parseFloat(value);
        if (!isNaN(asNum))
            return asNum !== 0;
    }

    switch (value.toLowerCase()) {
        case 'true':
        case 't':
        case 'yes':
        case 'y':
            return true;
        case 'false':
        case 'f':
        case 'no':
        case 'n':
            return false;
        default:
            return undefined;
    }
}

function parseString(value: JToken | undefined): string {
    if (value === undefined || value === null)
        return '';
    if (typeof value !== 'object')
        return value.toString();
    return JSON.stringify(value);
}
