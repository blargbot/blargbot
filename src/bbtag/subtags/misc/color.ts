import { guard } from '@blargbot/core/utils';
import Color from 'color';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { bbtag, SubtagType } from '../../utils';

export type ColorFormat = keyof typeof colorConverters;

export class ColorSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'color',
            category: SubtagType.MISC,
            description: 'If `inputFormat` is omitted or left empty, the format of `color` is automatically calculated, but might be innaccurate. For accuracy and known `color` formats use `inputFormat`. It converts all ways between `rgb`, `hsl`, `hsv`, `hwb`, `cmyk`, `ansi16`, `hex` strings, and CSS `keyword`s (will round to closest).', //TODO document the other formats too perhaps? As these are supported/working. (lab, lch, ansi256, hcg, apple, gray, xyz)
            definition: [
                {
                    parameters: ['color', 'outputFormat?:hex'],
                    description: 'Converts a color to `outputFormat`.',
                    exampleCode: '{color;#4286f4;RGB}',
                    exampleOut: '[66,134,244]',
                    returns: 'string',
                    execute: (ctx, [color, format]) => this.parseColor(ctx, color.value, format.value, undefined)
                },
                {
                    parameters: ['color', 'outputFormat:hex', 'inputFormat'],
                    description: 'Converts a color of `inputFormat` to `outputFormat`. If `inputFormat` is left empty, it will be automatically calculated.',
                    exampleCode: '{color;[66,134,244];hex;RGB}',
                    exampleOut: '#4286f4',
                    returns: 'string',
                    execute: (ctx, [color, outFormat, inFormat]) => this.parseColor(ctx, color.value, outFormat.value, inFormat.value)
                }
            ]
        });
    }

    public async parseColor(
        context: BBTagContext,
        colorStr: string,
        outputStr: string,
        inputStr: string | undefined
    ): Promise<string> {
        if (colorStr === '')
            throw new BBTagRuntimeError('Invalid color', 'value was empty');

        const arr = await bbtag.tagArray.deserializeOrGetArray(context, colorStr);
        const input = arr?.v.map(elem => elem?.toString()).join(',') ?? colorStr;

        const inputConverter = getConverter(inputStr ?? '');
        if (inputConverter === undefined)
            throw new BBTagRuntimeError('Invalid input method', `${JSON.stringify(inputStr)} is not valid`);

        const outputConverter = getConverter(outputStr);
        if (outputConverter === undefined)
            throw new BBTagRuntimeError('Invalid output method', `${JSON.stringify(outputStr)} is not valid`);

        try {
            const color = inputConverter.toColor(input);
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
}

interface ColorConverter {
    toColor(value: string): Color;
    toValue(value: Color): string | Color | number;
}

function getConverter(name: string): ColorConverter | undefined {
    name = name.toLowerCase();
    if (guard.hasProperty(colorConverters, name))
        return colorConverters[name];
    if (name === '')
        return defaultColorConverter;
    return undefined;
}

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
    toColor(str) {
        try {
            return colorConverters.hex.toColor(str);
        } catch {
            return colorConverters.rgb.toColor(str);
        }
    },
    toValue(color) {
        return colorConverters.hex.toValue(color);
    }
};

const colorConverters = {
    hsl: {
        toColor(str: string) { return Color(toChannels(str, 3), 'hsl'); },
        toValue(color: Color) { return color.hsl(); }
    },
    rgb: {
        toColor(str: string) { return Color(toChannels(str, 3), 'rgb'); },
        toValue(color: Color) { return color.rgb(); }
    },
    hsv: {
        toColor(str: string) { return Color(toChannels(str, 3), 'hsv'); },
        toValue(color: Color) { return color.hsv(); }
    },
    hwb: {
        toColor(str: string) { return Color(toChannels(str, 3), 'hwb'); },
        toValue(color: Color) { return color.hwb(); }
    },
    cmyk: {
        toColor(str: string) { return Color(toChannels(str, 4), 'cmyk'); },
        toValue(color: Color) { return color.cmyk(); }
    },
    xyz: {
        toColor(str: string) { return Color(toChannels(str, 3), 'xyz'); },
        toValue(color: Color) { return color.xyz(); }
    },
    lab: {
        toColor(str: string) { return Color(toChannels(str, 3), 'lab'); },
        toValue(color: Color) { return color.lab(); }
    },
    lch: {
        toColor(str: string) { return Color(toChannels(str, 3), 'lch'); },
        toValue(color: Color) { return color.lch(); }
    },
    hex: {
        toColor(str: string) { return Color(ensurePrefix(str, '#'), 'hex'); },
        toValue(color: Color) { return color.hex().slice(1); }
    },
    keyword: {
        toColor(str: string) { return Color(str, 'keyword'); },
        toValue(color: Color) { return color.keyword(); }
    },
    ansi16: {
        toColor(str: string) { return Color(toChannels(str, 1), 'ansi16'); },
        toValue(color: Color) { return color.ansi16(); }
    },
    ansi256: {
        toColor(str: string) { return Color(toChannels(str, 1), 'ansi256'); },
        toValue(color: Color) { return color.ansi256(); }
    },
    hcg: {
        toColor(str: string) { return Color(toChannels(str, 3), 'hcg'); },
        toValue(color: Color) { return color.hcg(); }
    },
    apple: {
        toColor(str: string) { return Color(toChannels(str, 3), 'apple'); },
        toValue(color: Color) { return color.apple(); }
    },
    gray: {
        toColor(str: string) { return Color(toChannels(str, 1), 'gray').rgb(); },
        toValue(color: Color) { return color.rgb().gray(); }
    }
} as const;
