import { BaseSubtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class RoundSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rounddown',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['number'],
                    description: 'Rounds `number` to the nearest whole number.',
                    exampleCode: '{round;1.23}',
                    exampleOut: '1',
                    execute: (context, [{value: numberStr}], subtag) => {
                        const number = parse.float(numberStr);
                        if (isNaN(number))
                            return this.notANumber(context, subtag);
                        return Math.round(number).toString();
                    }
                }
            ]
        });
    }
}
