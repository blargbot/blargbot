import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue, SubtagCall } from '@cluster/types';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class WhileSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'while',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['~boolean', '~code'],
                    description: 'This will continuously execute `code` for as long as `boolean` returns `true`.',
                    exampleCode: '{set;~x;0}\n{set;~end;false}\n{while;{get;~end};\n\t{if;{increment;~x};==;10;\n\t\t{set;~end;true}\n\t}\n}\n{get;~end}',
                    exampleOut: '10',
                    execute: (ctx, args, subtag) => this.executeWhile(ctx, args[0], '==', 'true', args[1], subtag)
                },
                {
                    parameters: ['~value1', '~evaluator', '~value2', '~code'],
                    description: 'This will continuously execute `code` for as long as the condition returns `true`. The condition is as follows:\n' +
                        'If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. ' +
                        'Valid evaluators are `' + Object.keys(bbtagUtil.operators.compare).join('`, `') + '`.',
                    exampleCode: '{set;~x;0}\n{while;{get;~x};<=;10;{increment;~x},}.',
                    exampleOut: '1,2,3,4,5,6,7,8,9,10,11,',
                    execute: (ctx, args, subtag) => this.executeWhile(ctx, args[0], args[1], args[2], args[3], subtag)
                }
            ]
        });
    }

    public async executeWhile(
        context: BBTagContext,
        val1Raw: SubtagArgumentValue,
        evaluator: SubtagArgumentValue | string,
        val2Raw: SubtagArgumentValue | string,
        codeRaw: SubtagArgumentValue,
        subtag: SubtagCall
    ): Promise<string> {
        let result = '';
        let reachedLimit = false;

        while (!(reachedLimit = await context.limit.check(context, subtag, 'while:loops') !== undefined)) {
            let right = await val1Raw.execute();
            let operator = typeof evaluator === 'string' ? evaluator : await evaluator.execute();
            let left = typeof val2Raw === 'string' ? val2Raw : await val2Raw.execute();

            if (bbtagUtil.operators.isCompareOperator(operator)) {
                //operator = operator;
            } else if (bbtagUtil.operators.isCompareOperator(left)) {
                //operator = left;
                [left, operator] = [operator, left];
            } else if (bbtagUtil.operators.isCompareOperator(right)) {
                //operator = right;
                [operator, right] = [right, operator];
            }

            if (bbtagUtil.operators.isCompareOperator(operator)) {
                if (bbtagUtil.operators.compare[operator](right, left))
                    result += await codeRaw.execute();
                else {
                    break;
                }
            } else {
                //TODO invalid operator stuff here
                result += await codeRaw.execute();
            }
        }

        if (reachedLimit)
            result += this.tooManyLoops(context, subtag); //* Not sure how I feel about subtags appending this error to the result. imo this should be the error should be returned
        return result;
    }
}
