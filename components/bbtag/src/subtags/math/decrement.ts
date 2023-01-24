import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotABooleanError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.decrement;

@Subtag.id('decrement')
@Subtag.ctorArgs(Subtag.converter())
export class DecrementSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
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

        this.#converter = converter;
    }

    public async decrement(context: BBTagContext, varName: string, amountStr: string, floorStr: string): Promise<number> {
        let amount = this.#converter.float(amountStr);
        if (amount === undefined)
            throw new NotANumberError(amountStr);

        const floor = this.#converter.boolean(floorStr);
        if (floor === undefined)
            throw new NotABooleanError(floorStr);

        const valueRaw = await context.variables.get(varName);
        let value: number | undefined;
        switch (typeof valueRaw.value) {
            case 'string':
                value = this.#converter.float(valueRaw.value);
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
