import { parse } from '@blargbot/core';

import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { AggregateBBTagError, BBTagRuntimeError, InvalidOperatorError, NotANumberError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import type { OrdinalOperator } from '../../utils/index.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.for;

type Features = VariablesFeature;
export class ForSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'for',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'initial', 'comparison', 'limit', 'increment?:1', '~code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'loop',
                    execute: (ctx, [variable, initial, operator, limit, increment, code]) => this.for(ctx, variable.value, initial.value, operator.value, limit.value, increment.value, code)
                }
            ]
        });
        this.#features = features;
    }

    public async * for(
        context: BBTagContext,
        varName: string,
        initialStr: string,
        operator: string,
        limitStr: string,
        incrementStr: string,
        code: SubtagArgument
    ): AsyncIterable<string> {
        const errors = [];
        const initial = parse.float(initialStr) ?? NaN;
        const limit = parse.float(limitStr) ?? NaN;
        const increment = parse.float(incrementStr) ?? NaN;

        if (isNaN(initial)) errors.push(new BBTagRuntimeError('Initial must be a number'));
        if (!bbtag.isComparisonOperator(operator)) errors.push(new InvalidOperatorError(operator));
        if (isNaN(limit)) errors.push(new BBTagRuntimeError('Limit must be a number'));
        if (isNaN(increment)) errors.push(new BBTagRuntimeError('Increment must be a number'));
        if (errors.length > 0)
            throw new AggregateBBTagError(errors);

        const variables = this.#features.variables.forContext(context);
        try {
            for (let i = initial; bbtag.operate(operator as OrdinalOperator, i.toString(), limit.toString()); i += increment) {
                await context.root.limit.check(context, 'for:loops');
                await variables.set(varName, i);
                yield await code.execute();

                const varEntry = await variables.get(varName);
                i = parse.float(parse.string(varEntry.value)) ?? NaN;

                if (isNaN(i))
                    throw new NotANumberError(varEntry.value);

                if (context.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        } finally {
            variables.reset([varName]);
        }
    }
}
