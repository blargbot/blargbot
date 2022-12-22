import type { SubtagArgument } from '../../arguments/index.js';
import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class WhileSubtag extends Subtag {
    public constructor() {
        super({
            name: 'while',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['~boolean', '~code'],
                    description: tag.value.description,
                    exampleCode: tag.value.exampleCode,
                    exampleOut: tag.value.exampleOut,
                    returns: 'loop',
                    execute: (ctx, [bool, code]) => this.while(ctx, bool, '==', 'true', code)
                },
                {
                    parameters: ['~value1', '~evaluator', '~value2', '~code'],
                    description: tag.condition.description({ operators: Object.keys(bbtag.comparisonOperators) }),
                    exampleCode: tag.condition.exampleCode,
                    exampleOut: tag.condition.exampleOut,
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
