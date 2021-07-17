import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue, SubtagCall } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const operators = bbtagUtil.operators.compare;

export class IfSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'if',
            category: SubtagType.COMPLEX,
            desc:
                'If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. ' +
                'If they are not provided, `value1` is read as `true` or `false`. ' +
                'If the resulting value is `true` then the tag returns `then`, otherwise it returns `else`.\n' +
                'Valid evaluators are `' + Object.keys(operators).join('`, `') + '`.',
            definition: [
                {
                    parameters: ['boolean', '~then'],
                    description:
                        'If `boolean` is `true`, return `then`, else do nothing.',
                    execute: (ctx, [{ value: bool }, thenCode], subtag) => this.simpleBooleanCheck(ctx, subtag, bool, thenCode)
                },
                {
                    parameters: ['boolean', '~then', '~else'],
                    description:
                        'If `boolean` is `true`, return `then`, else execute `else`',
                    execute: (ctx, [{ value: bool }, thenCode, elseCode], subtag) => this.simpleBooleanCheck(ctx, subtag, bool, thenCode, elseCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then'],
                    description:
                        '`Value1` is evaluated against `value2` using `evaluator, if the resulting value is `true` then the tag returns `then`.',
                    execute: (ctx, [{ value: value1 }, { value: evaluator }, { value: value2 }, thenCode], subtag) => this.evaluatorCheck(ctx, subtag, value1, evaluator, value2, thenCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then', '~else'],
                    description:
                        '`Value1` is evaluated against `value2` using `evaluator, if the resulting value is `true` then the tag returns `then`, otherwise it returns `else`',
                    execute: (ctx, [{ value: value1 }, { value: evaluator }, { value: value2 }, thenCode, elseCode], subtag) => this.evaluatorCheck(ctx, subtag, value1, evaluator, value2, thenCode, elseCode)
                }
            ]
        });
    }
    public async simpleBooleanCheck(
        context: BBTagContext,
        subtag: SubtagCall,
        bool: string,
        thenCode: SubtagArgumentValue,
        elseCode?: SubtagArgumentValue
    ): Promise<string> {
        const actualBoolean = parse.boolean(bool);
        if (typeof actualBoolean !== 'boolean')
            return this.customError('Not a boolean', context, subtag);

        if (actualBoolean) {
            return thenCode.wait();
        }
        if (elseCode !== undefined) {
            return elseCode.wait();
        }
        return '';

    }

    public async evaluatorCheck(
        context: BBTagContext,
        subtag: SubtagCall,
        value1: string,
        evaluator: string,
        value2: string,
        thenCode: SubtagArgumentValue,
        elseCode?: SubtagArgumentValue
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
            return this.customError('Invalid operator', context, subtag);
        }
        const leftBool = parse.boolean(value1, undefined, false);
        if (leftBool !== undefined) value1 = leftBool.toString();
        const rightBool = parse.boolean(value2, undefined, false);
        if (rightBool !== undefined) value2 = rightBool.toString();

        switch (operators[operator](value1, value2)) {
            case true: return await thenCode.wait();
            case false: return await elseCode?.wait() ?? '';
        }
    }
}
