import { BBTagRuntimeError, NotABooleanError, NotANumberError } from './BBTagRuntimeError.js';

type ThrowType = true | string
type MaybeThrowType = false | ThrowType | undefined;
type FallbackType<T> = T | (() => T);
type MaybeFallbackType<T> = FallbackType<T> | (() => T | undefined);

export interface ParseIntOptions {
    readonly radix?: number;
    readonly strict?: boolean;
    readonly throw?: MaybeThrowType;
    readonly fallback?: MaybeFallbackType<number>;
}
export interface ParseFloatOptions {
    readonly strict?: boolean;
    readonly throw?: MaybeThrowType;
    readonly fallback?: MaybeFallbackType<number>;
}
export interface ParseBooleanOptions {
    readonly includeNumbers?: boolean;
    readonly throw?: MaybeThrowType;
    readonly fallback?: MaybeFallbackType<boolean>;
}
export interface ParseDurationOptions {
    readonly throw?: MaybeThrowType;
    readonly fallback?: MaybeFallbackType<number>;
}

export const parse = {
    int: parseInt,
    float: parseFloat,
    boolean: parseBoolean,
    string: parseString,
    duration: parseDuration
};

function parseInt(s: JToken | undefined, options: ParseIntOptions & { throw: ThrowType; }): number
function parseInt(s: JToken | undefined, options: ParseIntOptions & { fallback: FallbackType<number>; }): number
function parseInt(s: JToken | undefined, options?: ParseIntOptions): number | undefined;
function parseInt(s: JToken | undefined, options: ParseIntOptions = {}): number | undefined {
    const result = parseIntCore(s, options);
    if (!isNaN(result))
        return result;
    const fallback = callOrReturn(options.fallback);
    if (fallback !== undefined)
        return fallback;
    if (options.throw === true)
        throw new NotANumberError(s);
    if (typeof options.throw === 'string')
        throw new NotANumberError(s).withDisplay(options.throw);
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

function parseFloat(s: JToken | undefined, options: ParseFloatOptions & { throw: ThrowType; }): number
function parseFloat(s: JToken | undefined, options: ParseFloatOptions & { fallback: FallbackType<number>; }): number
function parseFloat(s: JToken | undefined, options?: ParseFloatOptions): number | undefined;
function parseFloat(s: JToken | undefined, options: ParseFloatOptions = {}): number | undefined {
    const result = parseFloatCore(s, options);
    if (!isNaN(result))
        return result;
    const fallback = callOrReturn(options.fallback);
    if (fallback !== undefined)
        return fallback;
    if (options.throw === true)
        throw new NotANumberError(s);
    if (typeof options.throw === 'string')
        throw new NotANumberError(s).withDisplay(options.throw);
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

function parseBoolean(value: JToken | undefined, options: ParseBooleanOptions & { throw: ThrowType; }): boolean
function parseBoolean(value: JToken | undefined, options: ParseBooleanOptions & { fallback: FallbackType<boolean>; }): boolean
function parseBoolean(value: JToken | undefined, options?: ParseBooleanOptions): boolean | undefined;
function parseBoolean(value: JToken | undefined, options: ParseBooleanOptions = {}): boolean | undefined {
    const result = parseBooleanCore(value, options);
    if (result !== undefined)
        return result;
    const fallback = callOrReturn(options.fallback);
    if (fallback !== undefined)
        return fallback;
    if (options.throw === true)
        throw new NotABooleanError(value);
    if (typeof options.throw === 'string')
        throw new NotABooleanError(value).withDisplay(options.throw);
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

function callOrReturn<T>(value: T | (() => T)): T {
    return typeof value === 'function'
        ? (value as () => T)()
        : value;
}

function parseDuration(duration: string, options: ParseDurationOptions & { throw: ThrowType; }): number
function parseDuration(duration: string, options: ParseDurationOptions & { fallback: FallbackType<number>; }): number
function parseDuration(duration: string, options?: ParseDurationOptions): number | undefined
function parseDuration(duration: string, options: ParseDurationOptions = {}): number | undefined {
    let matched = false;
    let result = 0;
    for (const { regex, scale } of durationMatchers) {
        duration = duration.replaceAll(regex, (_, count: string) => {
            result += scale * globalThis.parseFloat(count);
            matched = true;
            return '';
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!matched || duration.trim().length > 0) {
        if (options.throw === true)
            throw new BBTagRuntimeError('Invalid duration');
        if (typeof options.throw === 'string')
            throw new BBTagRuntimeError('Invalid duration').withDisplay(options.throw);
        return undefined;
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
