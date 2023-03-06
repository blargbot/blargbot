import { CompiledSubtag } from '../../compilation/index.js';
import { InvalidOperatorError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools, BBTagOperators } from '../../utils/index.js';
import { numericOperators, SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.math;

@Subtag.names('math')
@Subtag.ctorArgs('operators', 'arrayTools', 'converter')
export class MathSubtag extends CompiledSubtag {
    readonly #operators: BBTagOperators;
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(operators: BBTagOperators, arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['operator', 'numbers+'],
                    description: tag.default.description({ operators: numericOperators.keys }),
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [operator, ...values]) => this.doMath(operator.value, values.map(arg => arg.value))
                }
            ]
        });

        this.#operators = operators;
        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public doMath(
        operator: string,
        args: string[]
    ): number {
        if (!numericOperators.test(operator))
            throw new InvalidOperatorError(operator);

        return this.#arrayTools.flattenArray(args).map((arg: JToken | undefined) => {
            const argRaw = arg;
            if (typeof arg === 'string')
                arg = this.#converter.float(arg);
            if (typeof arg !== 'number')
                throw new NotANumberError(argRaw);
            return arg;
        }).reduce(this.#operators.numeric[operator]);
    }
}
