import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { InvalidOperatorError, NotABooleanError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagOperators } from '../../utils/index.js';
import { comparisonOperators, SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.if;

@Subtag.names('if')
@Subtag.ctorArgs(Subtag.operators(), Subtag.converter())
export class IfSubtag extends CompiledSubtag {
    readonly #operators: BBTagOperators;
    readonly #converter: BBTagValueConverter;

    public constructor(operators: BBTagOperators, converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            description: tag.description({ operators: comparisonOperators.keys }),
            definition: [
                {
                    parameters: ['boolean', '~then'],
                    description: tag.value.description,
                    exampleCode: tag.value.exampleCode,
                    exampleOut: tag.value.exampleOut,
                    returns: 'string',
                    execute: (_, [bool, thenCode]) => this.simpleBooleanCheck(bool.value, thenCode)
                },
                {
                    parameters: ['boolean', '~then', '~else'],
                    description: tag.valueElse.description,
                    exampleCode: tag.valueElse.exampleCode,
                    exampleOut: tag.valueElse.exampleOut,
                    returns: 'string',
                    execute: (_, [bool, thenCode, elseCode]) => this.simpleBooleanCheck(bool.value, thenCode, elseCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then'],
                    description: tag.conditionThen.description,
                    exampleCode: tag.conditionThen.exampleCode,
                    exampleOut: tag.conditionThen.exampleOut,
                    returns: 'string',
                    execute: (_, [value1, evaluator, value2, thenCode]) => this.evaluatorCheck(value1.value, evaluator.value, value2.value, thenCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then', '~else'],
                    description: tag.conditionElse.description,
                    exampleCode: tag.conditionElse.exampleCode,
                    exampleOut: tag.conditionElse.exampleOut,
                    returns: 'string',
                    execute: (_, [value1, evaluator, value2, thenCode, elseCode]) => this.evaluatorCheck(value1.value, evaluator.value, value2.value, thenCode, elseCode)
                }
            ]
        });

        this.#operators = operators;
        this.#converter = converter;
    }
    public async simpleBooleanCheck(
        bool: string,
        thenCode: SubtagArgument,
        elseCode?: SubtagArgument
    ): Promise<string> {
        const actualBoolean = this.#converter.boolean(bool);
        if (typeof actualBoolean !== 'boolean')
            throw new NotABooleanError(bool);

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
        if (comparisonOperators.test(evaluator)) {
            operator = evaluator;
        } else if (comparisonOperators.test(value1)) {
            operator = value1;
            [value1, evaluator] = [evaluator, value1];
        } else if (comparisonOperators.test(value2)) {
            operator = value2;
            [evaluator, value2] = [value2, evaluator];
        } else
            throw new InvalidOperatorError(evaluator);

        const leftBool = this.#converter.boolean(value1, undefined, false);
        if (leftBool !== undefined)
            value1 = leftBool.toString();

        const rightBool = this.#converter.boolean(value2, undefined, false);
        if (rightBool !== undefined)
            value2 = rightBool.toString();

        if (this.#operators.comparison[operator](value1, value2))
            return await thenCode.wait();
        return await elseCode?.wait() ?? '';
    }
}
