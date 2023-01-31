import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.numberFormat;

@Subtag.names('numberFormat', 'numFormat')
@Subtag.ctorArgs(Subtag.converter())
export class NumberFormatSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
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

        this.#converter = converter;
    }
    public numFormat(
        numberStr: string,
        roundToStr: string,
        decimal: string,
        thousands: string
    ): string {
        const number = this.#converter.float(numberStr);
        if (number === undefined)
            return 'NaN';
        let roundto = this.#converter.int(roundToStr);
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
