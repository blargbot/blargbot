import { SubtagArgument } from '../../arguments';
import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeState } from '../../types';
import { bbtag, SubtagType } from '../../utils';

export class WhileSubtag extends CompiledSubtag {
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
                    description: `This will continuously execute \`code\` for as long as the condition returns \`true\`. The condition is as follows:\nIf \`evaluator\` and \`value2\` are provided, \`value1\` is evaluated against \`value2\` using \`evaluator\`. Valid evaluators are \`${Object.keys(bbtag.comparisonOperators).join('`, `')}\`.`,
                    exampleCode: '{set;~x;0}\n{while;{get;~x};<=;10;{increment;~x},}',
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
        while (context.data.state === BBTagRuntimeState.RUNNING) {

            let right = await val1Raw.execute();
            let operator = typeof evaluator === 'string' ? evaluator : await evaluator.execute();
            let left = typeof val2Raw === 'string' ? val2Raw : await val2Raw.execute();

            if (bbtag.isComparisonOperator(operator)) {
                //operator = operator;
            } else if (bbtag.isComparisonOperator(left)) {
                //operator = left;
                [left, operator] = [operator, left];
            } else if (bbtag.isComparisonOperator(right)) {
                //operator = right;
                [operator, right] = [right, operator];
            }

            if (!bbtag.isComparisonOperator(operator)) {
                //TODO invalid operator stuff here
                await context.limit.check(context, 'while:loops');
                yield await codeRaw.execute();
            } else if (!bbtag.operate(operator, right, left))
                break;
            else {
                await context.limit.check(context, 'while:loops');
                yield await codeRaw.execute();
            }
        }
    }
}
