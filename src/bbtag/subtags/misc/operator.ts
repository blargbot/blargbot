import { parse } from '@blargbot/core/utils';

import { SubtagArgumentArray } from '../../arguments';
import { CompiledSubtag } from '../../compilation';
import { InvalidOperatorError, NotABooleanError, NotANumberError } from '../../errors';
import templates from '../../text';
import { bbtag, LogicOperator, NumericOperator, OrdinalOperator, StringOperator, SubtagType } from '../../utils';

const tag = templates.subtags.operator;

export class OperatorSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'operator',
            aliases: Object.keys(bbtag.operators),
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['values+'],
                    returns: 'boolean|number',
                    execute: (_, values) => this.applyOperation(values)
                },
                ...Object.keys(bbtag.operators).map(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+']
                } as const))
            ]
        });
    }

    public applyOperation(args: SubtagArgumentArray): number | boolean {
        const operator = args.subtagName;
        const values = args.map((arg) => arg.value);
        if (bbtag.isOrdinalOperator(operator)) {
            return this.applyOrdinalOperation(operator, values);
        } else if (bbtag.isStringOperator(operator)) {
            return this.applyStringOperation(operator, values);
        } else if (bbtag.isNumericOperator(operator)) {
            return this.applyNumericOperation(operator, values);
        } else if (bbtag.isLogicOperator(operator)) {
            return this.applyLogicOperation(operator, values);
        }

        throw new InvalidOperatorError(operator);
    }

    public applyOrdinalOperation(operator: OrdinalOperator, values: string[]): boolean {
        const flattenedValues = bbtag.tagArray.flattenArray(values).map(v => parse.string(v));
        return bbtag.operate('&&', generatePairs(flattenedValues).map(args => bbtag.operate(operator, ...args)));
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
