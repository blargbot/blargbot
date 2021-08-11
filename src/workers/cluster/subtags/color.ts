import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { bbtagUtil, SubtagType } from '@cluster/utils';
import Color from 'color';

const getArray = bbtagUtil.tagArray.getArray;

type ColorFormat = typeof formats[number];

const formats = ['hsl', 'rgb', 'hsv', 'hwb', 'cmyk', 'xyz', 'lab', 'lch', 'hex', 'keyword', 'ansi16', 'ansi256', 'hcg', 'apple', 'gray'] as const;

function isColorFormat(value: string): value is ColorFormat | Uppercase<ColorFormat> {
    return (<readonly string[]>formats).includes(value.toLowerCase());
}

//* Thanks @types/color
interface RGBColor extends Color {
    model: 'rgb';
    color: string[] | number[] | undefined;
}

type ConvertedColor = RGBColor | { color: string; model: 'hex'; } | string;
export class ColorSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'color',
            category: SubtagType.COMPLEX,
            desc: 'If `inputFormat` is omitted or left empty, the format of `color` is automatically calculated, but might be innaccurate. For accuracy and known `color` formats use `inputFormat`. It converts all ways between `rgb`, `hsl`, `hsv`, `hwb`, `cmyk`, `ansi16`, `hex` strings, and CSS `keyword`s (will round to closest).', //TODO document the other formats too perhaps? As these are supported/working. (lab, lch, ansi256, hcg, apple, gray, xyz)
            definition: [
                {
                    parameters: ['color', 'outputFormat?:hex'],
                    description: 'Converts a color to `outputFormat`.',
                    exampleCode: '{color;#4286f4;RGB}',
                    exampleOut: '[66,134,244]',
                    execute: (ctx, args, subtag) => this.parseColor(ctx, args[0].value, args[1].value, undefined, subtag)
                },
                {
                    parameters: ['color', 'outputFormat:hex', 'inputFormat'],
                    description: 'Converts a color of `inputFormat` to `outputFormat`. If `inputFormat` is left empty, it will be automatically calculated.',
                    exampleCode: '{color;[66,134,244];hex;RGB}',
                    exampleOut: '#4286f4',
                    execute: (ctx, args, subtag) => this.parseColor(ctx, args[0].value, args[1].value, args[2].value as ColorFormat, subtag)
                }
            ]
        });
    }

    public async parseColor(
        context: BBTagContext,
        colorStr: string,
        outputStr: string,
        inputStr: string | undefined,
        subtag: SubtagCall
    ): Promise<string> {
        if (colorStr === '') return '`Invalid color`'; //TODO Would be better to use this.customError to add it to debug. This applies to the Invalid input/output formats too.

        const arr = await getArray(context, subtag, colorStr);
        let input: string | string[];
        if (arr === undefined || !Array.isArray(arr.v)) {
            input = colorStr;
        } else {
            input = arr.v.map(elem => elem?.toString()).join(',');
        }
        let parsedInput;
        if (typeof input === 'string') {
            const match = /^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/.exec(input);
            if (match !== null) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                parsedInput = [r, g, b];
            } else if (inputStr?.toLowerCase() === 'hsl') {
                input = input.split(',');
                parsedInput = [];
                for (const i of input) {
                    parsedInput.push(i);
                }
            } else parsedInput = input;
        } else {
            parsedInput = input;
        }

        let color: Color | undefined;

        let inputFormat: undefined | ColorFormat;
        if (inputStr === undefined) {
            // NOOP
        } else if (isColorFormat(inputStr)) {
            inputFormat = inputStr.toLowerCase();
        } else {
            return '`Invalid input method`';
        }

        let outputFormat: ColorFormat;
        if (isColorFormat(outputStr)) {
            outputFormat = outputStr.toLowerCase();
        } else {
            return '`Invalid input method`';
        }

        try {
            color = Color(parsedInput, inputFormat);
        } catch (e: unknown) {
            color = Color(`#${parsedInput.toString()}`, inputFormat);
        }

        if (typeof color === 'undefined') return '`Invalid color`';
        if (!formats.includes(outputFormat)) return '`Invalid output method`';

        let converted = color[outputFormat]() as ConvertedColor;

        if (typeof converted === 'object') {
            if (converted.model === 'rgb' && typeof converted.color !== 'undefined') {
                for (let i = 0; i < converted.color.length; i++) {
                    converted.color[i] = parseInt(converted.color[i].toString());
                }
            }

            if (typeof converted.color === 'object') {
                return JSON.stringify(converted.color);
            }
            if (converted.color?.indexOf('#') === 0) converted.color = converted.color.replace('#', '');
            return converted.color !== undefined ? converted.color : '';

        }
        if (converted.startsWith('#')) converted = converted.replace('#', '');
        return converted;

    }
}
