import { Cluster } from '../Cluster';
import { BaseSubtag, parse, SubtagType } from '../core';

export class NumFormatSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'numformat',
            desc: 'If `roundTo` is not provided, but the number does have decimals, rounds to `3` by default. Any precision for decimals will be lost e.g: `100.000000000`becomes `100` and `100.3100000000` becomes `100.31`',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['number', 'roundTo'],
                    description: 'Rounds `number` to `roundTo` digits. `roundTo` can be left empty.',
                    exampleCode: '{numformat;123456.789;2}\n{numformat;123456.789;-3}\n{numformat;100.10000}',
                    exampleOut: '123456.79\n123000\n100.1',
                    execute: (_, args) => this.numFormat(args.map(arg => arg.value))
                },
                {
                    parameters: ['number', 'roundTo', 'decimal:.', 'thousands?:'],
                    description: 'Rounds `number` to `roundTo` digits. Uses `decimal` as the decimal separator and `thousands` for the thousands separator. To skip `roundTo` or `decimal` leave them empty.',
                    exampleCode: '{numformat;3.1415;4;,}\n{numformat;100000;;;.}',
                    exampleOut: '3,1415\n100.000',
                    execute: (_, args) => this.numFormat(args.map(arg => arg.value))
                }
            ]
        });
    }
    public numFormat(
        args: string[]
    ): string {
        const number = parse.float(args[0]);
        if (number === NaN) return 'NaN';
        let roundto = parse.int(args[1]);
        const options: LocaleNumOptions = {}; // create formatter options
        if (roundto != NaN) {
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
        num[0] = num[0].split(',').join(args[3] || '');
        num = num.join(args[2] || '.');
        return num;
    }
}

interface LocaleNumOptions {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    maximumSignificantDigits?: number;
}