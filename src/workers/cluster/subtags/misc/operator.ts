import { DefinedSubtag } from '@cluster/bbtag';
import { InvalidOperatorError, NotABooleanError, NotANumberError } from '@cluster/bbtag/errors';
import { SubtagArgumentArray } from '@cluster/types';
import { bbtag, LogicOperator, NumericOperator, OrdinalOperator, parse, StringOperator, SubtagType } from '@cluster/utils';
import { EmbedOptions } from 'eris';

export class OperatorSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'operator',
            aliases: Object.keys(bbtag.operators),
            category: SubtagType.MISC,
            definition: [//! overwritten
                {
                    parameters: ['values+'],
                    description: '',
                    returns: 'boolean|number',
                    execute: (_, values) => this.applyOperation(values)
                }
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
        return bbtag.tagArray.flattenArray(values).map((arg) => {
            if (typeof arg === 'string')
                arg = parse.float(arg);
            if (typeof arg !== 'number' || isNaN(arg))
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

    public enrichDocs(docs: EmbedOptions): EmbedOptions {
        const numericOperationDesc = `\`${Object.keys(bbtag.numericOperators).join(', ')}\`\n` +
            'Numeric operators have the exact same behaviour as the operators in `{math}`. ' +
            'All `values` need to be `numbers`, if an argument is an array (of one level) it will be flattened.' +
            '\n**Examples**:```\n' +
            '{+;1;2;3} = 6\n{*;1;2;3;4} = 24\n{/;5} = 5 (5 / 1)\n- {^;2;6;2} = (2^6)^2 = 64^2 = 4096\n' +
            '{+;[1,2,3,4];5;[6,7,8]} = 36\n{+;[1,2,3];["hello", "world"]} = `Not a number`\n```';

        const logicOperationDesc = `\`${Object.keys(bbtag.logicOperators).join(', ')}\`\n` +
            'Logic operators have the exact same behaviour as the operators in `{logic}`, with the exception of `^` (described below).' +
            ' All `values` need to be valid booleans.' +
            '\n**Examples**:```\n' +
            '{&&;false;true} = false\n{||;false;true} = true\n{!;true;false;true} = false (this only considers the first value)' +
            '\n{xor;false;true} = true\n{xor;true;true} = false\n{^;false;true} = `Not a number` (don\'t do this! ^ is used for numeric operations!!)\n```';
        const comparisonOperationDesc = `\`${Object.keys(bbtag.comparisonOperators).join(', ')}\`` +
            '\nComparison operators behave in a similar way to `{bool}`, but can accept more than two values. If an argument is an array, this array will be flattened (except for `startswith, includes, contains and endswith`). Because it can accept more than two values the logic is a little different. `{==;1;2;3;4}` would mean `1 === 2 && 2 === 3 && 3 === 4`. For `startswith, includes, contains and endswith` this translates to the following:\n- `{includes;abc;a;b;c} = "abc".includes("a") && "abc".includes("b") && "abc".includes("c")`\n**Examples**:```\n' +
            '{==;true;true} = true\n{>;3;2;1} = true\n{startswith;Hello world!;Hello;He} = true\n{!=;blargbot;bad} = true\n' +
            '{>;3;1;2} = false\n{==;[1,2,3];[1,2,3]} = false\n{==;\'[1,2,3];\'[1,2,3]} = true\n```' +
            '\nBecause the arrays inside `{==;[1,2,3];[1,2,3]}` get flattened, this will result in `{==;1;2;3;1;2;3}`, which returns `false`. If you want to compare arrays, an additional character needs to be added, like: \n`{==;\'[1,2,3];\'[1,2,3]}`';

        docs.fields = [{
            name: '**Arguments:**',
            value: '```\n{<operator>;<...values>}```\nExecutes `operator` on the given `values`. Operators are described below.'

        },
        {
            name: 'Numeric operators:',
            value: numericOperationDesc
        },
        {
            name: 'Logic operators',
            value: logicOperationDesc
        },
        {
            name: 'Comparison operators',
            value: comparisonOperationDesc
        }
        ];

        return docs;

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
