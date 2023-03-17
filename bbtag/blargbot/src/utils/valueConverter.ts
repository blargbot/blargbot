import { createColorParser, parseBigInt, parseBoolean, parseDuration, parseFloat, parseInt, parseTime } from '@blargbot/input';
import { createUserRegExpParser } from '@blargbot/user-regex';
import type moment from 'moment-timezone';

import type { EmbedParser } from './embedParser.js';
import { createEmbedParser } from './embedParser.js';

export interface BBTagValueConverter {
    int(this: void, value: string, options?: { strict?: boolean; radix?: number; }): number | undefined;
    float(this: void, value: string, options?: { strict?: boolean; }): number | undefined;
    string(this: void, value: JToken | undefined): string;
    boolean(this: void, value: string | boolean | number | undefined, defValue: boolean, includeNumbers?: boolean): boolean;
    boolean(this: void, value: string | boolean | number | undefined, defValue?: undefined, includeNumbers?: boolean): boolean | undefined;
    duration(this: void, text: string, fallbackMs: moment.Duration): moment.Duration;
    duration(this: void, text: string, fallbackMs?: moment.Duration): moment.Duration | undefined;
    embed: EmbedParser;
    bigInt(this: void, s: string | number | bigint): bigint | undefined;
    color(this: void, text: number | 'random' | string): number | undefined;
    time(this: void, text: 'now' | 'today' | 'tomorrow' | 'yesterday' | string, format?: string, timezone?: string): moment.Moment;
    regex(this: void, text: string): { success: true; value: RegExp; } | { success: false; reason: 'tooLong' | 'invalid' | 'unsafe'; };
}

export function createValueConverter(options: ValueConverterOptions): BBTagValueConverter {
    const color = 'color' in options ? options.color : createColorParser(options.colors);
    const regex = 'regex' in options ? options.regex : createUserRegExpParser(options.regexMaxLength);
    const float = options.float ?? parseFloat;
    return {
        duration: options.duration ?? parseDuration,
        time: options.time ?? parseTime,
        bigInt: options.bigInt ?? parseBigInt,
        boolean: options.boolean ?? parseBoolean,
        int: options.int ?? parseInt,
        float,
        color,
        regex,
        string: function convertToString(this: void, value: JToken | undefined): string {
            if (typeof value === 'object') {
                if (value !== null)
                    return JSON.stringify(value);
                return '';
            } else if (value !== undefined) {
                return value.toString();
            }
            return '';
        },
        embed: options.embed ?? createEmbedParser({
            convertToColor: color,
            convertToNumber: float
        })

    };
}

export type ValueConverterOptions = Partial<Omit<BBTagValueConverter, 'color' | 'regex'>>
    & ({ colors: Record<string, number>; } | Pick<BBTagValueConverter, 'color'>)
    & ({ regexMaxLength: number; } | Pick<BBTagValueConverter, 'regex'>)
