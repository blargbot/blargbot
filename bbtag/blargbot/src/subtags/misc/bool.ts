import { CompiledSubtag } from '../../compilation/index.js';
import { InvalidOperatorError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagOperators } from '../../utils/index.js';
import { comparisonOperators, SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.bool;

@Subtag.names('bool')
@Subtag.ctorArgs('operators', 'converter')
export class BoolSubtag extends CompiledSubtag {
    readonly #operators: BBTagOperators;
    readonly #converter: BBTagValueConverter;

    public constructor(operators: BBTagOperators, converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['arg1', 'evaluator', 'arg2'],
                    description: tag.default.description({ operators: comparisonOperators.keys }),
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (_, [arg1, evaluator, arg2]) => this.runCondition(arg1.value, evaluator.value, arg2.value)
                }
            ]
        });

        this.#operators = operators;
        this.#converter = converter;
    }

    public runCondition(
        left: string,
        evaluator: string,
        right: string
    ): boolean {
        let operator;
        if (comparisonOperators.test(evaluator)) {
            operator = evaluator;
        } else if (comparisonOperators.test(left)) {
            [left, operator] = [evaluator, left];
        } else if (comparisonOperators.test(right)) {
            [operator, right] = [right, evaluator];
        } else
            throw new InvalidOperatorError(evaluator);

        const leftBool = this.#converter.boolean(left, undefined, false);
        if (leftBool !== undefined)
            left = leftBool.toString();
        const rightBool = this.#converter.boolean(right, undefined, false);
        if (rightBool !== undefined)
            right = rightBool.toString();

        return this.#operators.comparison[operator](left, right);
    }
}
