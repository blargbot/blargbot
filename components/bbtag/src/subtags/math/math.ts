import { parse } from '@blargbot/core/utils/index.js';

import { CompiledSubtag } from '../../compilation/index.js';
import { InvalidOperatorError, NotANumberError } from '../../errors/index.js';
import templates from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.math;

export class MathSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'math',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['operator', 'numbers+'],
                    description: tag.default.description({ operators: Object.keys(bbtag.numericOperators) }),
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [operator, ...values]) => this.doMath(operator.value, values.map(arg => arg.value))
                }
            ]
        });
    }

    public doMath(
        operator: string,
        args: string[]
    ): number {
        if (!bbtag.isNumericOperator(operator))
            throw new InvalidOperatorError(operator);

        return bbtag.tagArray.flattenArray(args).map((arg: JToken | undefined) => {
            const argRaw = arg;
            if (typeof arg === 'string')
                arg = parse.float(arg);
            if (typeof arg !== 'number')
                throw new NotANumberError(argRaw);
            return arg;
        }).reduce(bbtag.numericOperators[operator]);
    }
}
