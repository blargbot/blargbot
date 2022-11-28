import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotABooleanError, NotANumberError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.decrement;

export class DecrementSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'decrement',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['varName'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [{ value }]) => this.decrement(ctx, value, '1', 'true')
                },
                {
                    parameters: ['varName', 'amount:1', 'floor?:true'],
                    description: tag.count.description,
                    exampleCode: tag.count.exampleCode,
                    exampleOut: tag.count.exampleOut,
                    returns: 'number',
                    execute: (ctx, [varName, amount, floor]) => this.decrement(ctx, varName.value, amount.value, floor.value)
                }
            ]
        });
    }

    public async decrement(context: BBTagContext, varName: string, amountStr: string, floorStr: string): Promise<number> {
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

        value -= amount;
        await context.variables.set(varName, value);

        return value;
    }
}
