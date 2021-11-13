import { Subtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class NumFormatSubtag extends Subtag {
    public constructor() {
        super({
            name: 'numformat',
            desc: 'If `roundTo` is not provided, but the number does have decimals, rounds to `3` by default. Any precision for decimals will be lost e.g: `100.000000000`becomes `100` and `100.3100000000` becomes `100.31`',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number', 'roundTo'],
                    description: 'Rounds `number` to `roundTo` digits. `roundTo` can be left empty.',
                    exampleCode: '{numformat;123456.789;2}\n{numformat;123456.789;-3}\n{numformat;100.10000}',
                    exampleOut: '123456.79\n123000\n100.1',
                    execute: (_, [numberStr, roundToStr]) => this.numFormat(numberStr.value, roundToStr.value, '.', '')
                },
                {
                    parameters: ['number', 'roundTo', 'decimal:.', 'thousands?:'],
                    description: 'Rounds `number` to `roundTo` digits. Uses `decimal` as the decimal separator and `thousands` for the thousands separator. To skip `roundTo` or `decimal` leave them empty.',
                    exampleCode: '{numformat;3.1415;4;,}\n{numformat;100000;;;.}',
                    exampleOut: '3,1415\n100.000',
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
        if (isNaN(number)) return 'NaN';
        let roundto = parse.int(roundToStr);
        const options: LocaleNumOptions = {}; // create formatter options
        if (!isNaN(roundto)) {
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

interface LocaleNumOptions {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    maximumSignificantDigits?: number;
}
