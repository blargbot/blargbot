import { booleanResultAdapter, numberResultAdapter, Subtag } from '@bbtag/subtag';

import { InvalidOperatorError } from '../../errors/InvalidOperatorError.js';
import { NotABooleanError } from '../../errors/NotABooleanError.js';
import { NotANumberError } from '../../errors/NotANumberError.js';
import type { AggregationOperator } from '../../operators/aggregationOperators.js';
import { aggregationOperators } from '../../operators/aggregationOperators.js';
import type { LogicOperator } from '../../operators/logicOperators.js';
import { logicOperators } from '../../operators/logicOperators.js';
import type { NumericOperator } from '../../operators/numericOperators.js';
import { numericOperators } from '../../operators/numericOperators.js';
import type { OrdinalOperator } from '../../operators/ordinalOperators.js';
import { ordinalOperators } from '../../operators/ordinalOperators.js';
import type { SetOperator } from '../../operators/setOperators.js';
import { setOperators } from '../../operators/setOperators.js';
import { ArrayPlugin } from '../../plugins/ArrayPlugin.js';
import { BooleanPlugin } from '../../plugins/BooleanPlugin.js';
import { ComparePlugin } from '../../plugins/ComparePlugin.js';
import { NumberPlugin } from '../../plugins/NumberPlugin.js';
import { StringPlugin } from '../../plugins/StringPlugin.js';
import { p } from '../p.js';

export class OperatorSubtag extends Subtag {
    public constructor() {
        super({
            name: 'operator'
        });

    }

    @Subtag.signature({ id: 'error' })
        .parameter(p.name)
        .parameter(p.string('values').repeat(1))
    public returnError(subtagName: string): never {
        throw new InvalidOperatorError(subtagName);
    }

    @ordinalOp('<')
    @ordinalOp('<=')
    @ordinalOp('>')
    @ordinalOp('>=')
    @ordinalOp('==')
    @ordinalOp('!=')
    public applyOrdinalOperation(array: ArrayPlugin, string: StringPlugin, compare: ComparePlugin, values: string[], operator: (a: number, b: number) => boolean): boolean {
        const flat = array.flatten(values).map(v => string.toString(v));
        let prev = flat[0];
        for (const item of flat.slice(1))
            if (!operator(compare.compare(prev, prev = item), 0))
                return false;
        return true;
    }

    @aggregateOp('??')
    public applyAggregationOperation(array: ArrayPlugin, string: StringPlugin, values: string[], aggregate: (values: string[]) => string): string {
        const flat = array.flatten(values).map(v => string.toString(v));
        return aggregate(flat);
    }

    @setOp('startswith')
    @setOp('endswith')
    @setOp('includes')
    @setOp('contains')
    public applyStringOperation(array: ArrayPlugin, string: StringPlugin, compare: string, values: string[], operator: (a: string | string[], b: string) => boolean): boolean {
        const target = array.parseArray(compare)?.v.map(v => string.toString(v)) ?? compare;
        for (const item of values)
            if (!operator(target, item))
                return false;
        return true;
    }

    @numberOp('+')
    @numberOp('-')
    @numberOp('*')
    @numberOp('/')
    @numberOp('%')
    @numberOp('^')
    public applyNumericOperation(array: ArrayPlugin, number: NumberPlugin, values: string[], operator: (a: number, b: number) => number): number {
        const flat = array.flatten(values).map(v => {
            if (typeof v === 'number')
                return v;
            if (typeof v !== 'string')
                throw new NotANumberError(v);
            const res = number.parseFloat(v);
            if (res === undefined)
                throw new NotANumberError(v);
            return res;
        });
        return flat.reduce(operator);
    }

    @logicOp('&&')
    @logicOp('||')
    @logicOp('xor')
    @logicOp('!')
    public applyLogicOperation(array: ArrayPlugin, boolean: BooleanPlugin, values: string[], operator: (values: boolean[]) => boolean): boolean {
        const flat = array.flatten(values).map(v => {
            if (typeof v === 'boolean')
                return v;
            if (typeof v !== 'string')
                throw new NotABooleanError(v);
            const res = boolean.parseBoolean(v);
            if (res === undefined)
                throw new NotABooleanError(v);
            return res;
        });
        return operator(flat);
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function ordinalOp<T extends OrdinalOperator>(name: T) {
    return Subtag.signature({ id: name, subtagName: name })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(StringPlugin))
        .parameter(p.plugin(ComparePlugin))
        .parameter(p.string('values').repeat(1))
        .parameter(p.const(ordinalOperators[name]))
        .useConversion(booleanResultAdapter);
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function aggregateOp<T extends AggregationOperator>(name: T) {
    return Subtag.signature({ id: name, subtagName: name })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(StringPlugin))
        .parameter(p.string('values').repeat(1))
        .parameter(p.const(aggregationOperators[name]));
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function setOp<T extends SetOperator>(name: T) {
    return Subtag.signature({ id: name, subtagName: name })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(StringPlugin))
        .parameter(p.string('target'))
        .parameter(p.string('values').repeat(0))
        .parameter(p.const(setOperators[name]))
        .useConversion(booleanResultAdapter);
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function numberOp<T extends NumericOperator>(name: T) {
    return Subtag.signature({ id: name, subtagName: name })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(NumberPlugin))
        .parameter(p.string('values').repeat(1))
        .parameter(p.const(numericOperators[name]))
        .useConversion(numberResultAdapter);
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function logicOp<T extends LogicOperator>(name: T) {
    return Subtag.signature({ id: name, subtagName: name })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(BooleanPlugin))
        .parameter(p.string('values').repeat(1))
        .parameter(p.const(logicOperators[name]))
        .useConversion(booleanResultAdapter);
}
