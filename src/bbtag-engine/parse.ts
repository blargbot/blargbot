import type { BBTagRuntimeThrowable } from './BBTagRuntimeError.js';

type FallbackType<T> = T | (() => T);
type MaybeFallbackType<T> = FallbackType<T> | (() => T | null | undefined);

export interface ParseIntOptions {
    readonly radix?: number;
    readonly strict?: boolean;
    readonly throw?: BBTagRuntimeThrowable<[JToken | undefined]>;
    readonly fallback?: MaybeFallbackType<number>;
}
export interface ParseFloatOptions {
    readonly strict?: boolean;
    readonly throw?: BBTagRuntimeThrowable<[JToken | undefined]>;
    readonly fallback?: MaybeFallbackType<number>;
}
export interface ParseBooleanOptions {
    readonly includeNumbers?: boolean;
    readonly throw?: BBTagRuntimeThrowable<[JToken | undefined]>;
    readonly fallback?: MaybeFallbackType<boolean>;
}
export interface ParseDurationOptions {
    readonly throw?: BBTagRuntimeThrowable<[string]>;
    readonly fallback?: MaybeFallbackType<number>;
}
export interface ParseColorOptions {
    readonly fallback?: MaybeFallbackType<number>;
    readonly getByName?: (name: string) => number | null;
}

export const parse = {
    int: parseInt,
    float: parseFloat,
    boolean: parseBoolean,
    string: parseString,
    duration: parseDuration,
    color: parseColor,
    bigint(s: string | number | bigint): bigint | null {
        if (typeof s === 'bigint')
            return s;
        try {
            return BigInt(s);
        } catch {
            return null;
        }
    }
};

function parseInt(s: JToken | undefined, options: ParseIntOptions & { throw: NonNullable<unknown>; }): number
function parseInt(s: JToken | undefined, options: ParseIntOptions & { fallback: FallbackType<number>; }): number
function parseInt(s: JToken | undefined, options?: ParseIntOptions): number | null;
function parseInt(s: JToken | undefined, options: ParseIntOptions = {}): number | null {
    const result = parseIntCore(s, options);
    if (!isNaN(result))
        return result;
    const fallback = callOrReturn(options.fallback);
    if (typeof fallback === 'number')
        return fallback;
    if (options.throw !== undefined)
        throw new options.throw(s);
    return null;
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

function parseFloat(s: JToken | undefined, options: ParseFloatOptions & { throw: NonNullable<unknown>; }): number
function parseFloat(s: JToken | undefined, options: ParseFloatOptions & { fallback: FallbackType<number>; }): number
function parseFloat(s: JToken | undefined, options?: ParseFloatOptions): number | null;
function parseFloat(s: JToken | undefined, options: ParseFloatOptions = {}): number | null {
    const result = parseFloatCore(s, options);
    if (!isNaN(result))
        return result;
    const fallback = callOrReturn(options.fallback);
    if (typeof fallback === 'number')
        return fallback;
    if (options.throw !== undefined)
        throw new options.throw(s);
    return null;
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

function parseBoolean(value: JToken | undefined, options: ParseBooleanOptions & { throw: NonNullable<unknown>; }): boolean
function parseBoolean(value: JToken | undefined, options: ParseBooleanOptions & { fallback: FallbackType<boolean>; }): boolean
function parseBoolean(value: JToken | undefined, options?: ParseBooleanOptions): boolean | null;
function parseBoolean(value: JToken | undefined, options: ParseBooleanOptions = {}): boolean | null {
    const result = parseBooleanCore(value, options);
    if (result !== null)
        return result;
    const fallback = callOrReturn(options.fallback);
    if (typeof fallback === 'boolean')
        return fallback;
    if (options.throw !== undefined)
        throw new options.throw(value);
    return null;
}
function parseBooleanCore(value: JToken | undefined, options: ParseBooleanOptions): boolean | null {
    if (typeof value === 'boolean')
        return value;

    if (options.includeNumbers !== false && typeof value === 'number')
        return value !== 0;

    if (typeof value !== 'string') {
        return null;
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
            return null;
    }
}

function parseString(value: JToken | undefined): string {
    if (value === undefined || value === null)
        return '';
    if (typeof value !== 'object')
        return value.toString();
    return JSON.stringify(value);
}

function callOrReturn<T>(value: T | (() => T)): T {
    return typeof value === 'function'
        ? (value as () => T)()
        : value;
}

function parseDuration(value: string, options: ParseDurationOptions & { throw: NonNullable<unknown>; }): number
function parseDuration(value: string, options: ParseDurationOptions & { fallback: FallbackType<number>; }): number
function parseDuration(value: string, options?: ParseDurationOptions): number | null
function parseDuration(value: string, options: ParseDurationOptions = {}): number | null {
    let matched = false;
    let result = 0;
    let remain = value;
    for (const { regex, scale } of durationMatchers) {
        remain = remain.replaceAll(regex, (_, count: string) => {
            result += scale * globalThis.parseFloat(count);
            matched = true;
            return '';
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!matched || remain.trim().length > 0) {
        if (options.throw !== undefined)
            throw new options.throw(value);
        return null;
    }

    return result;
}

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const month = 30 * day;
const year = 365.25 * day;
const durationMatchers = [
    { names: ['years', 'year', 'y'], flags: 'i', scale: year },
    { names: ['months', 'month'], flags: 'i', scale: month },
    { names: ['M'], flags: '', scale: month },
    { names: ['weeks', 'week', 'w'], flags: 'i', scale: week },
    { names: ['days', 'day', 'd'], flags: 'i', scale: day },
    { names: ['hours', 'hour', 'h'], flags: 'i', scale: hour },
    { names: ['minutes', 'minute', 'm'], flags: 'i', scale: minute },
    { names: ['seconds', 'second', 's'], flags: 'i', scale: second },
    { names: ['milliseconds', 'millisecond', 'ms'], flags: 'i', scale: 1 }
].map(x => ({
    regex: new RegExp(`(\\d+) *(${x.names.join('|')})\\b`, `${x.flags}g`),
    scale: x.scale
}));

function parseColor(text: 'random', options?: ParseColorOptions): number;
function parseColor(text: number | string, options?: ParseColorOptions): number | null
function parseColor(text: number | string, options: ParseColorOptions = {}): number | null {
    if (typeof text === 'number')
        return text;

    text = text.replace(/\s+/g, '').toLowerCase();

    const name = text.replace(/[^a-z]/g, '');
    if (name === 'random')
        return Math.round(Math.random() * 0xFFFFFF);

    const result = options.getByName?.(name);
    if (typeof result === 'number')
        return result;

    //RGB 256,256,256
    let match = /^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/.exec(text);
    if (match !== null) {
        const r = globalThis.parseInt(match[1]);
        const g = globalThis.parseInt(match[2]);
        const b = globalThis.parseInt(match[3]);
        if (isNaN(r + g + b) || !isByte(r) || !isByte(g) || !isByte(b))
            return null;
        return globalThis.parseInt([r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''), 16);
    }

    //Hex code with 6 digits
    match = /^#?([0-9a-f]{6})$/i.exec(text);
    if (match !== null)
        return globalThis.parseInt(match[1], 16);

    //Hex code with 3 digits
    match = /^#?([0-9a-f]{3})$/i.exec(text);
    if (match !== null)
        return globalThis.parseInt(match[1].split('').map(v => v + v).join(''), 16);

    //Decimal number
    match = /^\.([0-9]{1,8})$/.exec(text);
    if (match !== null) {
        const value = globalThis.parseInt(match[1]);
        if (isUInt24(value))
            return value;
    }

    const fallback = callOrReturn(options.fallback);
    if (typeof fallback === 'number')
        return fallback;
    return null;
}

function isInt(value: number): boolean {
    return Number.isInteger(value);
}

function isByte(value: number): boolean {
    return isInt(value) && value >= 0 && value < 265;
}

function isUInt24(value: number): boolean {
    return isInt(value) && value >= 0 && value < 2 << 23;
}
