import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotABooleanError, NotANumberError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToBoolean, convertToNumber } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.increment;

type Features = VariablesFeature;
export class IncrementSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'increment',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['varName'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [varName]) => this.increment(ctx, varName.value, '1', 'true')
                },
                {
                    parameters: ['varName', 'amount:1', 'floor?:true'],
                    description: tag.count.description,
                    exampleCode: tag.count.exampleCode,
                    exampleOut: tag.count.exampleOut,
                    returns: 'number',
                    execute: (ctx, [varName, amount, floor]) => this.increment(ctx, varName.value, amount.value, floor.value)
                }
            ]
        });
        this.#features = features;
    }

    public async increment(context: BBTagContext, varName: string, amountStr: string, floorStr: string): Promise<number> {
        let amount = convertToNumber(amountStr);
        if (amount === undefined)
            throw new NotANumberError(amountStr);

        const floor = convertToBoolean(floorStr);
        if (floor === undefined)
            throw new NotABooleanError(floorStr);

        const variables = this.#features.variables.forContext(context);
        const valueRaw = await variables.get(varName);
        let value: number | undefined;
        switch (typeof valueRaw.value) {
            case 'string':
                value = convertToNumber(valueRaw.value);
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
        await variables.set(varName, value);

        return value;
    }
}
