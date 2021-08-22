import { BaseSubtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class RoundUpSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roundup',
            category: SubtagType.COMPLEX,
            aliases: ['ceil'],
            definition: [
                {
                    parameters: ['number'],
                    description: 'Rounds `number` up.',
                    exampleCode: '{roundup;1.23}',
                    exampleOut: '2',
                    execute: (context, [{value: numberStr}], subtag) => {
                        const number = parse.float(numberStr);
                        if (isNaN(number))
                            return this.notANumber(context, subtag);
                        return Math.ceil(number).toString();
                    }
                }
            ]
        });
    }
}
