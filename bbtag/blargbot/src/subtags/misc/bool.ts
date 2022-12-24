import { Subtag } from '@bbtag/subtag';

import { InvalidOperatorError } from '../../errors/InvalidOperatorError.js';
import { NotABooleanError } from '../../errors/NotABooleanError.js';
import { isLogicOperator, logicOperators } from '../../operators/logicOperators.js';
import { isOrdinalOperator, ordinalOperators } from '../../operators/ordinalOperators.js';
import { isSetOperator, setOperators } from '../../operators/setOperators.js';
import { ArrayPlugin } from '../../plugins/ArrayPlugin.js';
import { BooleanPlugin } from '../../plugins/BooleanPlugin.js';
import { ComparePlugin } from '../../plugins/ComparePlugin.js';
import { StringPlugin } from '../../plugins/StringPlugin.js';
import { p } from '../p.js';

export class BoolSubtag extends Subtag {
    public constructor() {
        super({
            name: 'bool'
        });
    }

    @Subtag.signature({ id: 'conditionElse', returns: 'boolean' })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(BooleanPlugin))
        .parameter(p.plugin(ComparePlugin))
        .parameter(p.plugin(StringPlugin))
        .parameter(p.string('value1'))
        .parameter(p.string('operator'))
        .parameter(p.string('value2'))
    public runCondition(
        array: ArrayPlugin,
        boolean: BooleanPlugin,
        compare: ComparePlugin,
        string: StringPlugin,
        value1: string,
        operator: string,
        value2: string
    ): boolean {
        return BoolSubtag.runCondition(array, boolean, compare, string, value1, operator, value2);
    }

    public static runCondition(
        array: ArrayPlugin,
        boolean: BooleanPlugin,
        compare: ComparePlugin,
        string: StringPlugin,
        value1: string,
        operator: string,
        value2: string
    ): boolean {
        const success = this.#test(array, boolean, compare, string, value1, operator, value2)
            ?? this.#test(array, boolean, compare, string, operator, value1, value2)
            ?? this.#test(array, boolean, compare, string, value2, value1, operator);

        if (success === undefined)
            throw new InvalidOperatorError(operator);

        return success;
    }

    static #test(
        array: ArrayPlugin,
        boolean: BooleanPlugin,
        compare: ComparePlugin,
        string: StringPlugin,
        value1: string,
        operator: string,
        value2: string
    ): boolean | undefined {
        if (isSetOperator(operator)) {
            const left = array.parseArray(value1)?.v.map(v => string.toString(v)) ?? value1;
            const right = value2;
            return setOperators[operator](left, right);
        }

        if (isOrdinalOperator(operator)) {
            const left = boolean.parseBoolean(value1, { allowNumbers: false })?.toString() ?? value1;
            const right = boolean.parseBoolean(value2, { allowNumbers: false })?.toString() ?? value2;
            return ordinalOperators[operator](compare.compare(left, right), 0);
        }

        if (isLogicOperator(operator)) {
            const left = boolean.parseBoolean(value1);
            if (left === undefined)
                throw new NotABooleanError(value1);
            const right = boolean.parseBoolean(value2);
            if (right === undefined)
                throw new NotABooleanError(value2);
            return logicOperators[operator]([left, right]);
        }

        return undefined;
    }
}
