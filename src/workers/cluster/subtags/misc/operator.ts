import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValueArray, SubtagCall } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { MessageEmbedOptions } from 'discord.js';

const { all: allOperators, logic, numeric, compare } = bbtagUtil.operators;

export class OperatorSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'operator',
            aliases: Object.keys(allOperators),
            category: SubtagType.COMPLEX,
            definition: [//! overwritten
                {
                    parameters: ['values+'],
                    description: '',
                    execute: (ctx, args, subtag) =>
                        this.applyOperation(ctx, args, subtag)
                }
            ]
        });
    }

    public applyOperation(
        context: BBTagContext,
        args: SubtagArgumentValueArray,
        subtag: SubtagCall
    ): string {
        if (args.subtagName.toLowerCase() === 'operator')
            return this.customError('Invalid operator \'operator\'', context, subtag);

        const operator = args.subtagName;
        const values = args.map((arg) => arg.value);
        if (bbtagUtil.operators.isCompareOperator(operator)) {
            return this.applyComparisonOperation(operator, values);
        } else if (bbtagUtil.operators.isNumericOperator(operator)) {
            /**
             * * It's important that numeric comes before logic, as they both have ^ as an operator
             */
            return this.applyNumericOperation(context, operator, values, subtag);
        } else if (bbtagUtil.operators.isLogicOperator(operator)) {
            return this.applyLogicOperation(context, operator, values, subtag);
        }
        //! This should never happen
        return this.customError('Invalid operator \'' + operator + '\'', context, subtag);

    }

    public applyComparisonOperation(
        operator: keyof typeof compare,
        values: string[]
    ): string {
        if (['startswith', 'includes', 'contains', 'endswith'].includes(operator)) {
            const firstValue = values[0];
            values = values.slice(1);
            const operatedValues = values.map((value) => {
                return compare[operator](firstValue, value);
            });

            return logic['&&'](operatedValues).toString();
        }

        const flattenedValues = bbtagUtil.tagArray.flattenArray(values).map((arg) => {
            switch (typeof arg) {
                case 'string':
                case 'number':
                case 'boolean': {
                    const possibleBoolean = parse.boolean(arg, undefined, false);
                    if (typeof possibleBoolean === 'boolean') arg = possibleBoolean;
                    return arg.toString();
                }
                case 'object':
                    return JSON.stringify(arg);
                case 'undefined':
                    return '';
            }
        });

        const pairedValues = this.generatePairs(flattenedValues);
        const operatedValues = pairedValues.map((pair) => compare[operator](pair[0], pair[1]));
        return logic['&&'](operatedValues).toString();
    }

    public generatePairs(array: string[]): string[][] {
        const pairedArrays: string[][] = [];
        for (let i = 0; i < array.length; i++) {
            if (i === array.length - 1) break;
            pairedArrays.push([array[i], array[i + 1]]);
        }
        return pairedArrays;
    }
    public applyNumericOperation(
        context: BBTagContext,
        operator: keyof typeof numeric,
        values: string[],
        subtag: SubtagCall
    ): string {
        const flattenedValues = bbtagUtil.tagArray.flattenArray(values).map((arg) => {
            switch (typeof arg) {
                case 'number': return arg;
                case 'string': return parse.float(arg);
                default: return NaN;
            }
        });

        if (flattenedValues.filter(isNaN).length !== 0) {
            const atIndex = flattenedValues.findIndex(isNaN);
            return this.notANumber(
                context,
                subtag,
                `${flattenedValues[atIndex]} at index ${atIndex}`
            );
        }

        return flattenedValues.reduce(numeric[operator]).toString();
    }

    public applyLogicOperation(
        context: BBTagContext,
        operator: keyof typeof logic,
        values: string[],
        subtag: SubtagCall
    ): string {
        if (operator === '!') {
            const value = parse.boolean(values[0]);
            if (typeof value !== 'boolean')
                return this.notABoolean(context, subtag, values[0] + ' is not a boolean');
            return logic[operator]([value]).toString();
        }

        const parsedValues = values.map((value) => parse.boolean(value));
        const parsedBools = parsedValues.filter((v): v is boolean => typeof v === 'boolean');
        if (parsedBools.length !== parsedValues.length)
            return this.notABoolean(
                context,
                subtag,
                `At index ${parsedValues.findIndex(
                    (v) => typeof v !== 'boolean'
                )}`
            );
        return logic[operator](parsedBools).toString();
    }

    public enrichDocs(
        docs: MessageEmbedOptions
    ): MessageEmbedOptions {
        const numericOperationDesc = `\`${Object.keys(numeric).join(', ')}\`\n` +
            'Numeric operators have the exact same behaviour as the operators in `{math}`. ' +
            'All `values` need to be `numbers`, if an argument is an array (of one level) it will be flattened.' +
            '\n**Examples**:```\n' +
            '{+;1;2;3} = 6\n{*;1;2;3;4} = 24\n{/;5} = 5 (5 / 1)\n- {^;2;6;2} = (2^6)^2 = 64^2 = 4096\n' +
            '{+;[1,2,3,4];5;[6,7,8]} = 36\n{+;[1,2,3];["hello", "world"]} = `Not a number`\n```';

        const logicOperationDesc = `\`${Object.keys(logic).filter(op => op !== '^').join(', ')}\`\n` +
            'Logic operators have the exact same behaviour as the operators in `{logic}`, with the exception of `^` (described below).' +
            ' All `values` need to be valid booleans.' +
            '\n**Examples**:```\n' +
            '{&&;false;true} = false\n{||;false;true} = true\n{!;true;false;true} = false (this only considers the first value)' +
            '\n{xor;false;true} = true\n{xor;true;true} = false\n{^;false;true} = `Not a number` (don\'t do this! ^ is used for numeric operations!!)\n```';
        const comparisonOperationDesc = `\`${Object.keys(compare).join(', ')}\`` +
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
