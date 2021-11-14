import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
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
export class ColorSubtag extends Subtag {
    public constructor() {
        super({
            name: 'color',
            category: SubtagType.MISC,
            desc: 'If `inputFormat` is omitted or left empty, the format of `color` is automatically calculated, but might be innaccurate. For accuracy and known `color` formats use `inputFormat`. It converts all ways between `rgb`, `hsl`, `hsv`, `hwb`, `cmyk`, `ansi16`, `hex` strings, and CSS `keyword`s (will round to closest).', //TODO document the other formats too perhaps? As these are supported/working. (lab, lch, ansi256, hcg, apple, gray, xyz)
            definition: [
                {
                    parameters: ['color', 'outputFormat?:hex'],
                    description: 'Converts a color to `outputFormat`.',
                    exampleCode: '{color;#4286f4;RGB}',
                    exampleOut: '[66,134,244]',
                    returns: 'string',
                    execute: (ctx, args) => this.parseColor(ctx, args[0].value, args[1].value, undefined)
                },
                {
                    parameters: ['color', 'outputFormat:hex', 'inputFormat'],
                    description: 'Converts a color of `inputFormat` to `outputFormat`. If `inputFormat` is left empty, it will be automatically calculated.',
                    exampleCode: '{color;[66,134,244];hex;RGB}',
                    exampleOut: '#4286f4',
                    returns: 'string',
                    execute: (ctx, args) => this.parseColor(ctx, args[0].value, args[1].value, args[2].value)
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

        const arr = await getArray(context, colorStr);
        const input = arr?.v.map(elem => elem?.toString()).join(',') ?? colorStr;
        let parsedInput;
        const match = /^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/.exec(input);
        if (match !== null) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            parsedInput = [r, g, b];
        } else if (inputStr?.toLowerCase() === 'hsl') {
            parsedInput = input.split(',');
        } else {
            parsedInput = input;
        }

        let inputFormat: undefined | ColorFormat;
        if (inputStr === undefined) {
            // NOOP
        } else if (isColorFormat(inputStr)) {
            inputFormat = inputStr.toLowerCase();
        } else {
            throw new BBTagRuntimeError('Invalid input method', `${JSON.stringify(inputStr)} is not valid`);
        }

        let outputFormat: ColorFormat;
        if (isColorFormat(outputStr)) {
            outputFormat = outputStr.toLowerCase();
        } else {
            throw new BBTagRuntimeError('Invalid input method', `${JSON.stringify(outputStr)} is not valid`);
        }

        let color: Color | undefined;
        try {
            color = Color(parsedInput, inputFormat);
        } catch (e: unknown) {
            color = Color(`#${parsedInput.toString()}`, inputFormat);
        }

        if (typeof color === 'undefined')
            throw new BBTagRuntimeError('Invalid color', colorStr);
        if (!formats.includes(outputFormat))
            throw new BBTagRuntimeError('Invalid output method', `${JSON.stringify(outputFormat)} is not a valid`);

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
            if (converted.color?.indexOf('#') === 0)
                converted.color = converted.color.replace('#', '');
            return converted.color !== undefined ? converted.color : '';

        }

        if (converted.startsWith('#'))
            converted = converted.replace('#', '');
        return converted;

    }
}
