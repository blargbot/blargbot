import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagArgument } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const operators = bbtagUtil.operators.compare;

export class IfSubtag extends Subtag {
    public constructor() {
        super({
            name: 'if',
            category: SubtagType.MISC,
            desc:
                'If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. ' +
                'If they are not provided, `value1` is read as `true` or `false`. ' +
                'If the resulting value is `true` then the tag returns `then`, otherwise it returns `else`.\n' +
                'Valid evaluators are `' + Object.keys(operators).join('`, `') + '`.',
            definition: [
                {
                    parameters: ['boolean', '~then'],
                    description: 'If `boolean` is `true`, return `then`, else do nothing.',
                    returns: 'string',
                    execute: (_, [{ value: bool }, thenCode]) => this.simpleBooleanCheck(bool, thenCode)
                },
                {
                    parameters: ['boolean', '~then', '~else'],
                    description: 'If `boolean` is `true`, return `then`, else execute `else`',
                    returns: 'string',
                    execute: (_, [{ value: bool }, thenCode, elseCode]) => this.simpleBooleanCheck(bool, thenCode, elseCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then'],
                    description: '`Value1` is evaluated against `value2` using `evaluator, if the resulting value is `true` then the tag returns `then`.',
                    returns: 'string',
                    execute: (_, [{ value: value1 }, { value: evaluator }, { value: value2 }, thenCode]) => this.evaluatorCheck(value1, evaluator, value2, thenCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then', '~else'],
                    description: '`Value1` is evaluated against `value2` using `evaluator, if the resulting value is `true` then the tag returns `then`, otherwise it returns `else`',
                    returns: 'string',
                    execute: (_, [{ value: value1 }, { value: evaluator }, { value: value2 }, thenCode, elseCode]) => this.evaluatorCheck(value1, evaluator, value2, thenCode, elseCode)
                }
            ]
        });
    }
    public async simpleBooleanCheck(
        bool: string,
        thenCode: SubtagArgument,
        elseCode?: SubtagArgument
    ): Promise<string> {
        const actualBoolean = parse.boolean(bool);
        if (typeof actualBoolean !== 'boolean')
            throw new BBTagRuntimeError('Not a boolean');

        if (actualBoolean) {
            return await thenCode.wait();
        }
        return await elseCode?.wait() ?? '';

    }

    public async evaluatorCheck(
        value1: string,
        evaluator: string,
        value2: string,
        thenCode: SubtagArgument,
        elseCode?: SubtagArgument
    ): Promise<string> {
        let operator;
        if (bbtagUtil.operators.isCompareOperator(evaluator)) {
            operator = evaluator;
        } else if (bbtagUtil.operators.isCompareOperator(value1)) {
            operator = value1;
            [value1, evaluator] = [evaluator, value1];
        } else if (bbtagUtil.operators.isCompareOperator(value2)) {
            operator = value2;
            [evaluator, value2] = [value2, evaluator];
        } else {
            throw new BBTagRuntimeError('Invalid operator');
        }
        const leftBool = parse.boolean(value1, undefined, false);
        if (leftBool !== undefined)
            value1 = leftBool.toString();

        const rightBool = parse.boolean(value2, undefined, false);
        if (rightBool !== undefined)
            value2 = rightBool.toString();

        if (operators[operator](value1, value2))
            return await thenCode.wait();
        return await elseCode?.wait() ?? '';
    }
}
