import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.numformat;

export class NumFormatSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'numformat',
            description: tag.description,
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number', 'roundTo'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [numberStr, roundToStr]) => this.numFormat(numberStr.value, roundToStr.value, '.', '')
                },
                {
                    parameters: ['number', 'roundTo', 'decimal:.', 'thousands?:'],
                    description: tag.separator.description,
                    exampleCode: tag.separator.exampleCode,
                    exampleOut: tag.separator.exampleOut,
                    returns: 'string',
                    execute: (_, [numberStr, roundToStr, decimal, thousands]) => this.numFormat(numberStr.value, roundToStr.value, decimal.value, thousands.value)
                }
            ]
        });
    }
    public numFormat(
        numberStr: string,
        roundToStr: string,
        decimal: string,
        thousands: string
    ): string {
        const number = parse.float(numberStr);
        if (number === undefined)
            return 'NaN';
        let roundto = parse.int(roundToStr);
        const options: Intl.NumberFormatOptions = {}; // create formatter options
        if (roundto !== undefined) {
            roundto = Math.min(20, Math.max(-21, roundto));
            const trunclen = Math.trunc(number).toString().length;
            if (roundto >= 0) {
                options.minimumFractionDigits = roundto;
                options.maximumFractionDigits = roundto;
            } else if (trunclen + roundto >= 0) {
                options.maximumSignificantDigits = trunclen + roundto;
            }
        }
        let num: string | string[] = number.toLocaleString('en-US', options).split('.');
        num[0] = num[0].split(',').join(thousands);
        num = num.join(decimal);
        return num;
    }
}
