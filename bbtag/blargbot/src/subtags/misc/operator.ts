import { InvalidOperatorError, NotABooleanError, NotANumberError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';
import { parse } from '@blargbot/core/utils/index.js';

import type { SubtagSignatureCallableOptions as Options } from '../../compilation/SubtagSignatureCallableOptions.js';
import { ArrayPlugin, StringPlugin } from '../../index.js';
import { ordinalOperators } from '../../operators/ordinalOperators.js';
import { ComparePlugin } from '../../plugins/ComparePlugin.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { AggregationOperator } from '../../utils/operators.js';
import { p } from '../p.js';

export class OperatorSubtag extends Subtag {
    public constructor() {
        super({
            name: 'operator',
            category: SubtagType.MISC,
            definition: [
                ...Object.keys(ordinalOperators).map<Options<'boolean'>>(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+'],
                    returns: 'boolean',
                    execute: (_, values) => this.applyOrdinalOperation(op, values.map(v => v.value))
                })),
                ...Object.keys(stringOperators).map<Options<'boolean'>>(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+'],
                    returns: 'boolean',
                    execute: (_, values) => this.applyStringOperation(op, values.map(v => v.value))
                })),
                ...Object.keys(logicOperators).map<Options<'boolean'>>(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+'],
                    returns: 'boolean',
                    execute: (_, values) => this.applyLogicOperation(op, values.map(v => v.value))
                })),
                ...Object.keys(numericOperators).map<Options<'number'>>(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+'],
                    returns: 'number',
                    execute: (_, values) => this.applyNumericOperation(op, values.map(v => v.value))
                })),
                ...Object.keys(aggregationOperators).map<Options<'string'>>(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+'],
                    returns: 'string',
                    execute: (_, values) => this.applyAggregationOperation(op, values.map(v => v.value))
                })),
                {
                    parameters: ['values+'],
                    returns: 'error',
                    execute: (_, values) => { throw new InvalidOperatorError(values.subtagName); }
                }
            ]
        });

    }

    public applyOrdinalOperation(array: ArrayPlugin, string: StringPlugin, compare: ComparePlugin, values: string[], operator: (comp: ComparePlugin, a: string, b: string) => boolean): boolean {
        const flat = array.flatten(values).map(v => string.toString(v));
        let prev = flat[0];
        for (const item of flat.slice(1))
            if (!operator(compare, prev, prev = item))
                return false;
        return true;
    }

    public applyAggregationOperation(operator: AggregationOperator, values: string[]): string {
        const flattenedValues = bbtag.tagArray.flattenArray(values).map(v => parse.string(v));
        return bbtag.operate(operator, flattenedValues);
    }

    public applyStringOperation(operator: StringOperator, values: string[]): boolean {
        const firstValue = values[0];
        values = values.slice(1);
        const operatedValues = values.map((value) => {
            return bbtag.operate(operator, firstValue, value);
        });

        return bbtag.operate('&&', operatedValues);
    }

    public applyNumericOperation(operator: NumericOperator, values: string[]): number {
        return bbtag.tagArray.flattenArray(values).map((arg: JToken | undefined) => {
            if (typeof arg === 'string')
                arg = parse.float(arg);
            if (typeof arg !== 'number')
                throw new NotANumberError(arg);
            return arg;
        }).reduce(bbtag.operators[operator]);
    }

    public applyLogicOperation(operator: LogicOperator, values: string[]
    ): boolean {
        const parsed = values.map((value) => {
            const bool = parse.boolean(value);
            if (bool === undefined)
                throw new NotABooleanError(value);
            return bool;
        });
        return bbtag.operate(operator, parsed);
    }
}

function generatePairs(array: string[]): Array<[string, string]> {
    const pairedArrays: Array<[string, string]> = [];
    for (let i = 0; i < array.length; i++) {
        if (i === array.length - 1) break;
        pairedArrays.push([array[i], array[i + 1]]);
    }
    return pairedArrays;
}

function decorateAll<T extends (...args: Args) => void, Args extends readonly unknown[]>(items: Iterable<T>): (...args: Args) => void {
    return (...args) => {
        for (const item of [...items].reverse())
            item(...args);
    };
}

for (const [name, op] of Object.entries(ordinalOperators))
    Subtag.signature({ id: name, returns: 'boolean', subtagName: name })
        .parameter(p.plugin(ArrayPlugin))
        .parameter(p.plugin(StringPlugin))
        .parameter(p.plugin(ComparePlugin))
        .parameter(p.string('values').repeat())
        .parameter(p.const(op))(OperatorSubtag.prototype, 'applyOrdinalOperation');
