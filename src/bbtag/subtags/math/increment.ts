import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotABooleanError, NotANumberError } from '../../errors';
import { SubtagType } from '../../utils';

export class IncrementSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'increment',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['varName'],
                    description: 'Increases `varName`\'s value by `1`. ',
                    exampleCode: '{set;~counter;0} {repeat;{increment;~counter},;10}',
                    exampleOut: '1,2,3,4,5,6,7,8,9,10',
                    returns: 'number',
                    execute: (ctx, [varName]) => this.increment(ctx, varName.value, '1', 'true')
                },
                {
                    parameters: ['varName', 'amount:1', 'floor?:true'],
                    description: 'Increases `varName`\'s value by `amount`. `floor` is a boolean, and if it is `true` then the value will be rounded down.',
                    exampleCode: '{set;~counter;0} {repeat;{increment;~counter;-2},;10}',
                    exampleOut: '2,4,6,8,10,12,14,16,18,20',
                    returns: 'number',
                    execute: (ctx, [varName, amount, floor]) => this.increment(ctx, varName.value, amount.value, floor.value)
                }
            ]
        });
    }

    public async increment(context: BBTagContext, varName: string, amountStr: string, floorStr: string): Promise<number> {
        let amount = parse.float(amountStr);
        if (amount === undefined)
            throw new NotANumberError(amountStr);

        const floor = parse.boolean(floorStr);
        if (floor === undefined)
            throw new NotABooleanError(floorStr);

        const valueRaw = await context.variables.get(varName);
        let value: number | undefined;
        switch (typeof valueRaw.value) {
            case 'string':
                value = parse.float(valueRaw.value);
                break;
            case 'number':
                value = valueRaw.value;
                break;
        }
        if (value === undefined)
            throw new NotANumberError(valueRaw.value);

        if (floor) {
            value = Math.floor(value);
            amount = Math.floor(amount);
        }

        value += amount;
        await context.variables.set(varName, value);

        return value;
    }
}
