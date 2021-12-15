import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { RuntimeReturnState, SubtagArgument } from '@cluster/types';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class WhileSubtag extends DefinedSubtag {
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
                    returns: 'loop',
                    execute: (ctx, [bool, code]) => this.while(ctx, bool, '==', 'true', code)
                },
                {
                    parameters: ['~value1', '~evaluator', '~value2', '~code'],
                    description: 'This will continuously execute `code` for as long as the condition returns `true`. The condition is as follows:\n' +
                        'If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. ' +
                        'Valid evaluators are `' + Object.keys(bbtagUtil.comparisonOperators).join('`, `') + '`.',
                    exampleCode: '{set;~x;0}\n{while;{get;~x};<=;10;{increment;~x},}.',
                    exampleOut: '1,2,3,4,5,6,7,8,9,10,11,',
                    returns: 'loop',
                    execute: (ctx, [val1, evaluator, val2, code]) => this.while(ctx, val1, evaluator, val2, code)
                }
            ]
        });
    }

    public async * while(
        context: BBTagContext,
        val1Raw: SubtagArgument,
        evaluator: SubtagArgument | string,
        val2Raw: SubtagArgument | string,
        codeRaw: SubtagArgument
    ): AsyncIterable<string> {
        while (context.state.return === RuntimeReturnState.NONE) {
            await context.limit.check(context, 'while:loops');

            let right = await val1Raw.execute();
            let operator = typeof evaluator === 'string' ? evaluator : await evaluator.execute();
            let left = typeof val2Raw === 'string' ? val2Raw : await val2Raw.execute();

            if (bbtagUtil.isComparisonOperator(operator)) {
                //operator = operator;
            } else if (bbtagUtil.isComparisonOperator(left)) {
                //operator = left;
                [left, operator] = [operator, left];
            } else if (bbtagUtil.isComparisonOperator(right)) {
                //operator = right;
                [operator, right] = [right, operator];
            }

            if (!bbtagUtil.isComparisonOperator(operator))
                //TODO invalid operator stuff here
                yield await codeRaw.execute();
            else if (!bbtagUtil.operate(operator, right, left))
                break;
            else
                yield await codeRaw.execute();
        }
    }
}
