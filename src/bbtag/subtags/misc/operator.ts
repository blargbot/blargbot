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
                ...Object.entries(operatorDefinitions).map(([op, def]) => ({
                    ...def,
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

const operatorDefinitions: { [P in keyof typeof bbtag['operators']]: { description: string; exampleCode: string; exampleOut: string; } } = {
    '%': {
        description: 'Returns the remainder after dividing each pair of `value`s.',
        exampleCode: '{%;24;5} {%;24;5;3} {%;19;5;4}',
        exampleOut: '4 1 0'
    },
    '*': {
        description: 'Returns the result from multiplying all the `value`s together',
        exampleCode: '{*;1;2;3;4}',
        exampleOut: '24'
    },
    '+': {
        description: 'Returns the result from summing all the `values`s together',
        exampleCode: '{+;1;2;3;4}',
        exampleOut: '10'
    },
    '-': {
        description: 'Returns the result from subtracting all the `value`s from the first',
        exampleCode: '{-;4;3;2;1}',
        exampleOut: '-2'
    },
    '/': {
        description: 'Returns the result from dividing the first `value` by all the rest',
        exampleCode: '{/;5} {/;120;5;4;3}',
        exampleOut: '5 2'
    },
    '^': {
        description: 'Returns the result of raising the first `value` to the power of all the rest',
        exampleCode: '{^;2;3} {^;2;2;2;2}',
        exampleOut: '8 256'
    },
    '<': {
        description: 'Returns `true` if each `value` is less than the value after it, otherwise `false`',
        exampleCode: '{<;a} {<;a;b;c;c} {<;1;2;3;4;2} {<;a;b;c;d}',
        exampleOut: 'false false false true'
    },
    '<=': {
        description: 'Returns `true` if each `value` is less than or equal to the value after it, otherwise `false`',
        exampleCode: '{<=;a} {<=;a;b;c;c} {<;1;2;3;4;2} {<=;a;b;c;d}',
        exampleOut: 'false true false true'
    },
    '!=': {
        description: 'Returns `true` if all pairs of `value`s are not equal',
        exampleCode: '{!=;a;b;c} {!=;a;b;a} {!=;a;a;b}',
        exampleOut: 'true true false'
    },
    '==': {
        description: 'Returns `true` if all `value`s are equal, otherwise `false`',
        exampleCode: '{==;a;b;c} {==;a;b;a} {==;a;a;b} {==;a;a;a;a;a}',
        exampleOut: 'false false false true'
    },
    '>': {
        description: 'Returns `true` if each `value` is greater than the value after it, otherwise `false`',
        exampleCode: '{>;a} {>;c;c;b;a} {>;2;4;3;2;1} {>;d;c;b;a}',
        exampleOut: 'false false false true'
    },
    '>=': {
        description: 'Returns `true` if each `value` is greater than or equal to the value after it, otherwise `false`',
        exampleCode: '{>=;a} {>=;c;c;b;a} {>=;2;4;3;2;1} {>=;d;c;b;a}',
        exampleOut: 'false true false true'
    },
    '!': {
        description: 'Inverts a boolean `value`. All values after the first one are ignored.',
        exampleCode: '{!;true} {!;false}',
        exampleOut: 'false true'
    },
    '&&': {
        description: 'Returns `true` if all of the `value`s are `true`, otherwise `false`',
        exampleCode: '{&&;true;true} {&&;true;false;true}',
        exampleOut: 'true false'
    },
    '||': {
        description: 'Returns `true` if any of the `value`s are `true`, otherwise `false`',
        exampleCode: '{||;false;false} {||;true;false;true}',
        exampleOut: 'false true'
    },
    'xor': {
        description: 'Returns `true` if exactly 1 of the `value`s are `true`, otherwise `false`',
        exampleCode: '{^;false;false} {^;true;false;true} {^;false;true;false}',
        exampleOut: 'false false true'
    },
    'contains': {
        description: 'Returns `true` if the first `value` contains all the rest. If the first `value` is an array then the array must contain all the remaining values.',
        exampleCode: '{contains;abcdefghi;abc} {contains;["abc","def","ghi"];","}',
        exampleOut: 'true false'
    },
    'includes': {
        description: 'Returns `true` if the first `value` contains all the rest. If the first `value` is an array then the array must contain all the remaining values.',
        exampleCode: '{includes;abcdefghi;abc} {includes;["abc","def","ghi"];","}',
        exampleOut: 'true false'
    },
    'endswith': {
        description: 'Returns `true` if the first `value` ends with all the rest. If the first `value` is an array then the last element must equal all the remaining values.',
        exampleCode: '{endswith;abcdefghi;ghi;fghi;hi} {endswith;["abc","def","ghi"];"]}',
        exampleOut: 'true false'
    },
    'startswith': {
        description: 'Returns `true` if the first `value` starts with all the rest. If the first `value` is an array then the first element must equal all the remaining values.',
        exampleCode: '{startswith;abcdefghi;a;abcd;abc} {startswith;["abc","def","ghi"];["}',
        exampleOut: 'true false'
    }
};

function generatePairs(array: string[]): Array<[string, string]> {
    const pairedArrays: Array<[string, string]> = [];
    for (let i = 0; i < array.length; i++) {
        if (i === array.length - 1) break;
        pairedArrays.push([array[i], array[i + 1]]);
    }
    return pairedArrays;
}
