import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import type { BBTagOperators } from '../../utils/index.js';
import { comparisonOperators, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.while;

@Subtag.id('while')
@Subtag.ctorArgs(Subtag.operators())
export class WhileSubtag extends CompiledSubtag {
    #operators: BBTagOperators;

    public constructor(operators: BBTagOperators) {
        super({
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
                    description: tag.condition.description({ operators: comparisonOperators.keys }),
                    exampleCode: tag.condition.exampleCode,
                    exampleOut: tag.condition.exampleOut,
                    returns: 'loop',
                    execute: (ctx, [val1, evaluator, val2, code]) => this.while(ctx, val1, evaluator, val2, code)
                }
            ]
        });

        this.#operators = operators;
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

            if (comparisonOperators.test(operator)) {
                //operator = operator;
            } else if (comparisonOperators.test(left)) {
                //operator = left;
                [left, operator] = [operator, left];
            } else if (comparisonOperators.test(right)) {
                //operator = right;
                [operator, right] = [right, operator];
            }

            if (!comparisonOperators.test(operator)) {
                //TODO invalid operator stuff here
                await context.limit.check(context, 'while:loops');
                yield await codeRaw.execute();
            } else if (!this.#operators.comparison[operator](right, left))
                break;
            else {
                await context.limit.check(context, 'while:loops');
                yield await codeRaw.execute();
            }
        }
    }
}
