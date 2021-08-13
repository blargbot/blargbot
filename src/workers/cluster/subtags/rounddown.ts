import { BaseSubtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class RoundDownSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rounddown',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['number'],
                    description: 'Rounds `number` down.',
                    exampleCode: '{rounddown;1.23}',
                    exampleOut: '1',
                    execute: (context, [{value: numberStr}], subtag) => {
                        const number = parse.float(numberStr);
                        if (isNaN(number))
                            return this.notANumber(context, subtag);
                        return Math.floor(number).toString();
                    }
                }
            ]
        });
    }
}
