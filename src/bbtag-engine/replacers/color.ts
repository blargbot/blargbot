import { bbtagArray } from '../bbtagArray.js';
import { BBTagRuntimeError } from '../BBTagRuntimeError.js';
import { defineReplacer } from '../defineReplacer.js';
import type { VariablesLocals } from './locals.js';

export type ColorParser = (channels: [number, number?, number?, number?] | string, format: Colorspace) => Color;

export type Colorspace =
    | 'hsl'
    | 'rgb'
    | 'hex'
    | 'hsv'
    | 'hwb'
    | 'cmyk'
    | 'xyz'
    | 'lab'
    | 'lch'
    | 'keyword'
    | 'ansi16'
    | 'ansi256'
    | 'hcg'
    | 'apple'
    | 'gray';

type ColorConverters = { [P in Colorspace]: () => Color };
export interface Color extends Omit<ColorConverters, 'hex' | 'keyword' | 'gray'> {
    round(precision: number): Color;
    array(): readonly number[];
    hex(): string;
    keyword(): string;
    gray(): number;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const colorReplacerFactory = (options: { parseColor: ColorParser; }) => defineReplacer<VariablesLocals>('color', {
    parameters: ['color', 'outputFormat?:hex', 'inputFormat?'],
    returns: 'string',
    execute: async function parseColorExplicit(ctx, [{ value: colorStr }, { value: outFormat }, { value: inFormat }]) {
        if (colorStr === '')
            throw new BBTagRuntimeError('Invalid color', 'value was empty');

        const arr = await bbtagArray.deserializeOrGetArray(ctx, colorStr);
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const input = arr?.v.map(elem => elem?.toString()).join(',') ?? colorStr;

        const inputConverter = getConverter(inFormat);
        if (inputConverter === undefined)
            throw new BBTagRuntimeError('Invalid input method', `${JSON.stringify(inFormat)} is not valid`);

        const outputConverter = getConverter(outFormat);
        if (outputConverter === undefined)
            throw new BBTagRuntimeError('Invalid output method', `${JSON.stringify(outFormat)} is not valid`);

        try {
            const color = inputConverter.toColor(options.parseColor, input);
            const result = outputConverter.toValue(color);
            switch (typeof result) {
                case 'string': return result;
                case 'number': return result.toString();
                default: return JSON.stringify(result.round(2).array());
            }
        } catch {
            throw new BBTagRuntimeError('Invalid color', `${JSON.stringify(colorStr)} is not a valid color`);
        }
    }
});

interface ColorConverter {
    toColor(parser: ColorParser, value: string): Color;
    toValue(value: Color): string | Color | number;
}

function getConverter(name: string): ColorConverter | undefined {
    name = name.toLowerCase();
    if (Object.hasOwn(colorConverters, name))
        return colorConverters[name];
    if (name === '')
        return defaultColorConverter;
    return undefined;
}

function toChannels(value: string, channels: 1): [number]
function toChannels(value: string, channels: 3): [number, number, number]
function toChannels(value: string, channels: 4): [number, number, number, number]
function toChannels(value: string, channels: number): number[] {
    const match = new RegExp(`^\\(?(-?\\d+(?:\\.\\d+)?(?:,-?\\d+(?:\\.\\d+)?){${channels - 1}})\\)?$`).exec(value);
    if (match === null)
        throw new Error('Invalid channels');

    return match[0].split(',').map(parseFloat);
}

function ensurePrefix(value: string, prefix: string): string {
    return value.startsWith(prefix) ? value : prefix + value;
}

const defaultColorConverter: ColorConverter = {
    toColor(parse, str) {
        try {
            return colorConverters.hex.toColor(parse, str);
        } catch {
            return colorConverters.rgb.toColor(parse, str);
        }
    },
    toValue(color) {
        return colorConverters.hex.toValue(color);
    }
};

const colorConverters = {
    hsl: {
        toColor(parse, str) { return parse(toChannels(str, 3), 'hsl'); },
        toValue(color) { return color.hsl(); }
    },
    rgb: {
        toColor(parse, str) { return parse(toChannels(str, 3), 'rgb'); },
        toValue(color) { return color.rgb(); }
    },
    hsv: {
        toColor(parse, str) { return parse(toChannels(str, 3), 'hsv'); },
        toValue(color) { return color.hsv(); }
    },
    hwb: {
        toColor(parse, str) { return parse(toChannels(str, 3), 'hwb'); },
        toValue(color) { return color.hwb(); }
    },
    cmyk: {
        toColor(parse, str) { return parse(toChannels(str, 4), 'cmyk'); },
        toValue(color) { return color.cmyk(); }
    },
    xyz: {
        toColor(parse, str) { return parse(toChannels(str, 3), 'xyz'); },
        toValue(color) { return color.xyz(); }
    },
    lab: {
        toColor(parse, str) { return parse(toChannels(str, 3), 'lab'); },
        toValue(color) { return color.lab(); }
    },
    lch: {
        toColor(parse, str) { return parse(toChannels(str, 3), 'lch'); },
        toValue(color) { return color.lch(); }
    },
    hex: {
        toColor(parse, str) { return parse(ensurePrefix(str, '#'), 'hex'); },
        toValue(color) { return color.hex().slice(1); }
    },
    keyword: {
        toColor(parse, str) { return parse(str, 'keyword'); },
        toValue(color) { return color.keyword(); }
    },
    ansi16: {
        toColor(parse, str) { return parse(toChannels(str, 1), 'ansi16'); },
        toValue(color) { return color.ansi16(); }
    },
    ansi256: {
        toColor(parse, str) { return parse(toChannels(str, 1), 'ansi256'); },
        toValue(color) { return color.ansi256(); }
    },
    hcg: {
        toColor(parse, str) { return parse(toChannels(str, 3), 'hcg'); },
        toValue(color) { return color.hcg(); }
    },
    apple: {
        toColor(parse, str) { return parse(toChannels(str, 3), 'apple'); },
        toValue(color) { return color.apple(); }
    },
    gray: {
        toColor(parse, str) { return parse(toChannels(str, 1), 'gray'); },
        toValue(color) { return color.gray(); }
    }
} satisfies Record<Colorspace, ColorConverter>;
