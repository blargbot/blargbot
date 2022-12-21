import { parse } from '@blargbot/core/utils/index.js';

import type { SubtagSignatureCallableOptions as Options } from '../../compilation/SubtagSignatureCallableOptions.js';
import { InvalidOperatorError, NotABooleanError, NotANumberError } from '../../errors/index.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import type { LogicOperator, NumericOperator, OrdinalOperator, StringOperator } from '../../utils/index.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { AggregationOperator } from '../../utils/operators.js';
import { aggregationOperators, logicOperators, numericOperators, ordinalOperators, stringOperators } from '../../utils/operators.js';

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

    public applyOrdinalOperation(operator: OrdinalOperator, values: string[]): boolean {
        const flattenedValues = bbtag.tagArray.flattenArray(values).map(v => parse.string(v));
        return bbtag.operate('&&', generatePairs(flattenedValues).map(args => bbtag.operate(operator, ...args)));
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
