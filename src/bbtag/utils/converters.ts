import { colorMap } from '@blargbot/colors';
import { zodStringToJson } from '@blargbot/core';
import z from 'zod';

import type { Embed, MalformedEmbed } from '../types.js';

export function convertToString(value: unknown): string {
    switch (typeof value) {
        case 'object':
            if (value !== null)
                return JSON.stringify(value);
            return '';
        case 'number':
        case 'boolean':
        case 'string':
        case 'bigint':
            return value.toString();
        default:
            return '';
    }
}

export function convertToBoolean(value: string): boolean | undefined {
    const asNumber = convertToNumber(value);
    if (asNumber !== undefined)
        return asNumber !== 0;
    return convertToBooleanStrict(value);
}

export function convertToBooleanStrict(value: string): boolean | undefined {
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

export function convertToNumber(value: string): number | undefined {
    value = value.replaceAll(/[,.](?=[^,.]*[,.])/g, '').replace(/[,.]/, '.');
    const result = parseFloat(value);
    return isNaN(result) ? undefined : result;
}

export function convertToNumberStrict(value: string): number | undefined {
    value = value.replaceAll(/[,.](?=[^,.]*[,.])/g, '').replace(/[,.]/, '.');
    if (!/^[+-]?\d+(?:\.\d+)?$/.test(value))
        return undefined;
    const result = parseFloat(value);
    return isNaN(result) ? undefined : result;
}
type Enumerate<
    N extends number,
    Acc extends number[] = [],
> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>;

type NumberRange<Start extends number, End extends number> =
    Exclude<Enumerate<End>, Enumerate<Start>> | Start | End;
type Radix = NumberRange<2, 36>
const charset = '0123456789abcdefghijklmnopqrstuvwxyz';
const radixRegexArr = Array.from({ length: charset.length - 1 }, (_, i) => [(i + 2) as Radix, new RegExp(`^[+-]?[${charset.slice(0, i + 2)}]+$`, 'i')] as const);
const radixes = new Set(radixRegexArr.map(x => x[0]));
const radixRegexes = Object.fromEntries(radixRegexArr);

export function isRadix(value: number): value is Radix {
    return radixes.has(value);
}

export function convertToInteger(value: string, radix: Radix = 10): number | undefined {
    value = value.replaceAll(/[,.](?=[^,.]*[,.])/g, '').replace(/[,.]/, '.');
    const result = parseInt(value, radix);
    return isNaN(result) ? undefined : result;
}

export function convertToIntegerStrict(value: string, radix: Radix = 10): number | undefined {
    value = value.replaceAll(/[,.](?=[^,.]*[,.])/g, '').replace(/[,.]/, '.');
    const result = parseInt(value, radix);
    if (!radixRegexes[radix].test(value))
        return undefined;
    return isNaN(result) ? undefined : result;
}

export function convertToBigInt(value: string): bigint | undefined {
    try {
        return BigInt(value);
    } catch {
        return undefined;
    }
}

type DurationWord = keyof typeof durationWords;
type DurationUnit = typeof durationWords[DurationWord];
const durationWords = {
    y: 'years',
    year: 'years',
    years: 'years',
    M: 'months',
    month: 'months',
    months: 'months',
    w: 'weeks',
    week: 'weeks',
    weeks: 'weeks',
    d: 'days',
    day: 'days',
    days: 'days',
    h: 'hours',
    hour: 'hours',
    hours: 'hours',
    m: 'minutes',
    min: 'minutes',
    mins: 'minutes',
    minute: 'minutes',
    minutes: 'minutes',
    s: 'seconds',
    sec: 'seconds',
    secs: 'seconds',
    second: 'seconds',
    seconds: 'seconds',
    ms: 'milliseconds',
    millisecond: 'milliseconds',
    milliseconds: 'milliseconds'
} as const;

function unitOf(word: string): DurationUnit | undefined {
    if (Object.hasOwn(durationWords, word))
        return durationWords[word];
    word = word.toLowerCase();
    if (Object.hasOwn(durationWords, word))
        return durationWords[word];
    return undefined;
}

// Size of each unit in nanoseconds, used to turn a fractional part into smaller units.
// Months use the Gregorian average (30.436875 days), which is also what moment assumed.
const seconds = 1_000_000_000n;
const unitMultiples: Record<Exclude<DurationUnit, 'years'>, bigint> = {
    months: 2_629_746n * seconds,
    weeks: 7n * 86_400n * seconds,
    days: 86_400n * seconds,
    hours: 3_600n * seconds,
    minutes: 60n * seconds,
    seconds: seconds,
    milliseconds: 1_000_000n
};

export function convertToDuration(text: string): Temporal.Duration | undefined {
    const pattern = /\s*(\d+(?:\.\d+)?) ?([a-z]+)/iy;
    const quantities = new Map<DurationUnit, string>();

    let position = 0;
    while (position < text.length) {
        pattern.lastIndex = position;
        const match = pattern.exec(text);
        if (match === null)
            break;
        const [, quantity, word] = match;
        const unit = unitOf(word);
        if (unit === undefined || quantities.has(unit))
            return undefined;
        quantities.set(unit, quantity);
        position = pattern.lastIndex;
    }

    if (quantities.size === 0 || text.slice(position).trim().length > 0)
        return undefined;

    const total = { years: 0n, months: 0n, days: 0n, hours: 0n, minutes: 0n, seconds: 0n, milliseconds: 0n };
    let remainder = 0n;
    for (const [unit, quantity] of quantities) {
        const [integer, fraction = ''] = quantity.split('.');
        const numerator = BigInt(integer + fraction);
        const denominator = 10n ** BigInt(fraction.length);
        const whole = numerator / denominator;
        const part = numerator % denominator;

        if (unit === 'years') {
            const months = part * 12n;
            total.years += whole;
            total.months += months / denominator;
            remainder += months % denominator * unitMultiples.months / denominator;
        } else if (unit === 'weeks') {
            total.days += 7n * whole;
            remainder += part * unitMultiples.weeks / denominator;
        } else {
            total[unit] += whole;
            remainder += part * unitMultiples[unit] / denominator;
        }
    }

    const take = (size: bigint): bigint => {
        const count = remainder / size;
        remainder %= size;
        return count;
    };
    total.days += take(unitMultiples.days);
    total.hours += take(unitMultiples.hours);
    total.minutes += take(unitMultiples.minutes);
    total.seconds += take(unitMultiples.seconds);
    total.milliseconds += take(unitMultiples.milliseconds);
    const microseconds = take(1_000n);

    try {
        return Temporal.Duration.from({
            years: Number(total.years),
            months: Number(total.months),
            days: Number(total.days),
            hours: Number(total.hours),
            minutes: Number(total.minutes),
            seconds: Number(total.seconds),
            milliseconds: Number(total.milliseconds),
            microseconds: Number(microseconds),
            nanoseconds: Number(remainder)
        });
    } catch (e) {
        if (e instanceof RangeError) // beyond what Temporal.Duration can represent
            return undefined;
        throw e;
    }
}

export function convertToEmbed(embedText: undefined, allowMalformed?: true): undefined;
export function convertToEmbed(embedText: string | undefined, allowMalformed?: true): Array<Embed | MalformedEmbed> | undefined;
export function convertToEmbed(embedText: string | undefined, allowMalformed: false): Embed[] | undefined;
export function convertToEmbed(embedText: string | undefined, allowMalformed = true): Array<Embed | MalformedEmbed> | undefined {
    if (embedText === undefined || embedText.trim().length === 0)
        return undefined;

    const embeds = mapEmbeds.safeParse(embedText);
    if (!embeds.success)
        return undefined;

    const results = Array.isArray(embeds.data) ? embeds.data : [embeds.data];
    if (!allowMalformed && results.some(r => 'malformed' in r))
        return undefined;

    return results;
}

function fail(ctx: z.RefinementCtx): never {
    ctx.addIssue('failed');
    return z.NEVER;
}

const mapEmbedCore = z.object({
    author: z.object({
        icon_url: z.string().optional(),
        name: z.string().optional().default(''),
        url: z.string().optional()
    }).optional(),
    color: z.union([
        z.number(),
        z.string().transform((v, ctx) => convertToColor(v) ?? fail(ctx)),
        z.string().transform((v, ctx) => convertToInteger(v) ?? fail(ctx)),
        z.tuple([
            z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number),
            z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number),
            z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number)
        ]).transform(([r, g, b]) => r << 16 | g << 8 | b),
        z.string().regex(/^#\d+$/).transform(v => convertToInteger(v.slice(1), 16) ?? NaN)
    ]).optional(),
    description: z.string().optional(),
    fields: z.object({
        inline: z.boolean().optional(),
        name: z.string(),
        value: z.string()
    }).array().optional(),
    footer: z.object({
        icon_url: z.string().optional(),
        text: z.string().optional().default('')
    }).optional(),
    image: z.object({
        url: z.string().optional()
    }).optional(),
    thumbnail: z.object({
        url: z.string().optional()
    }).optional(),
    timestamp: z.union([
        z.iso.date()
    ]).optional(),
    title: z.string().optional(),
    url: z.string().optional()
});

const mapMalformedEmbed = z.unknown().transform(v => JSON.stringify(v)).transform(value => ({
    fields: [{ name: 'Malformed JSON', value: value.length > 1024 ? `${value.slice(0, 1021)}...` : value }],
    malformed: true
}));

const mapEmbeddable = z.union([
    mapEmbedCore,
    z.union([mapEmbedCore, mapMalformedEmbed]).array(),
    mapMalformedEmbed
]);

const mapEmbeds = z.union([
    zodStringToJson.pipe(mapEmbeddable),
    mapEmbeddable
]);

const colorKeys = Object.keys(colorMap);

export function convertToColor(text: 'random'): number;
export function convertToColor(text: number | string): number | undefined
export function convertToColor(text: number | string): number | undefined {
    if (typeof text === 'number')
        return text;

    text = text.replace(/\s+/g, '').toLowerCase();

    const name = text.toLowerCase().replace(/[^a-z]/g, '');
    if (name === 'random')
        return Math.floor(Math.random() * 0x1000000);

    //By name
    if (colorKeys.includes(name))
        return colorMap[name];

    //RGB 256,256,256
    let match = /^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/.exec(text);
    if (match !== null) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        if (isNaN(r + g + b) || !isByte(r) || !isByte(g) || !isByte(b))
            return undefined;
        return r << 16 | g << 8 | b;
    }

    //Hex code with 6 digits
    match = /^#?([0-9a-f]{6})$/i.exec(text);
    if (match !== null)
        return parseInt(match[1], 16);

    //Hex code with 3 digits
    match = /^#?([0-9a-f]{3})$/i.exec(text);
    if (match !== null)
        return parseInt(match[1].split('').map(v => v + v).join(''), 16);

    //Decimal number
    match = /^\.([0-9]{1,8})$/.exec(text);
    if (match !== null) {
        const value = parseInt(match[1]);
        if (isUInt24(value))
            return value;
    }

    return undefined;
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
