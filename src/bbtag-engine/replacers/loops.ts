import { bbtagArray } from '../bbtagArray.js';
import type { BBTagContext } from '../BBTagContext.js';
import { AggregateBBTagError, BBTagRuntimeError, InvalidOperatorError } from '../BBTagRuntimeError.js';
import { cacheResult } from '../cacheResult.js';
import type { SubtagArgument } from '../compilation/arguments/SubtagArgument.js';
import { defineReplacer } from '../defineReplacer.js';
import type { OrdinalOperator } from '../operators.js';
import { isComparisonOperator, operate } from '../operators.js';
import { parse } from '../parse.js';
import type { FallbackLocals, VariablesLocals } from './locals.js';

export const forReplacer = defineReplacer<VariablesLocals>('for', {
    parameters: ['variable', 'initial', 'comparison', 'limit', 'increment?:1', '~code'],
    returns: 'loop',
    execute: async function* forReplacer(ctx, [{ value: variable }, { value: initialStr }, { value: operator }, { value: limitStr }, { value: incrementStr }, code]) {
        const errors = [];
        const initial = parse.float(initialStr) ?? NaN;
        const limit = parse.float(limitStr) ?? NaN;
        const increment = parse.float(incrementStr) ?? NaN;

        if (isNaN(initial)) errors.push(new BBTagRuntimeError('Initial must be a number'));
        if (!isComparisonOperator(operator)) errors.push(new InvalidOperatorError(operator));
        if (isNaN(limit)) errors.push(new BBTagRuntimeError('Limit must be a number'));
        if (isNaN(increment)) errors.push(new BBTagRuntimeError('Increment must be a number'));
        if (errors.length > 0)
            throw new AggregateBBTagError(errors);

        try {
            for (let i = initial; operate(operator as OrdinalOperator, i.toString(), limit.toString()); i += increment) {
                await ctx.locals.variables.set(variable, i);
                yield await code.execute();

                const varEntry = await ctx.locals.variables.get(variable);
                i = parse.float(varEntry.value, { throw: true });
                if (ctx.return !== 0)
                    break;
            }
        } finally {
            ctx.locals.variables.rollback([variable]);
        }
    }
});
export const foreachReplacer = defineReplacer<VariablesLocals>('forEach', {
    parameters: ['variable', 'array#10000000', '~code'],
    returns: 'loop',
    execute: async function* foreachReplacer(context, [{ value: variable }, { value: source }, code]) {
        const array = await bbtagArray.deserializeOrGetIterable(context, source) ?? [];
        try {
            for (const item of array) {
                await context.locals.variables.set(variable, item);
                yield await code.execute();

                if (context.return !== 0)
                    break;
            }
        } finally {
            context.locals.variables.rollback([variable]);
        }
    }

});
export const repeatReplacer = defineReplacer<VariablesLocals & FallbackLocals>(['repeat', 'loop'], {
    parameters: ['~code', 'amount'],
    returns: 'loop',
    execute: async function* repeatReplacer(ctx, [code, { value: amountStr }]) {
        const fallback = cacheResult(() => parse.int(ctx.locals.fallback));
        const amount = parse.int(amountStr, { fallback, throw: true });
        if (amount < 0)
            throw new BBTagRuntimeError('Can\'t be negative');

        for (let i = 0; i < amount; i++) {
            yield await code.execute();
            if (ctx.return !== 0)
                break;
        }
    }
});

export const whileReplacer = defineReplacer<VariablesLocals>(
    'while',
    {
        parameters: ['~boolean', '~code'],
        returns: 'loop',
        execute: async function* whileReplacer(ctx, [bool, code]) {
            yield* whileImpl(ctx, bool, '==', 'true', code);
        }
    },
    {
        parameters: ['~value1', '~evaluator', '~value2', '~code'],
        returns: 'loop',
        execute: async function* whileConditionReplacer(ctx, [val1, evaluator, val2, code]) {
            yield* whileImpl(ctx, val1, evaluator, val2, code);
        }
    }
);
async function* whileImpl(
    context: BBTagContext<VariablesLocals>,
    val1Raw: SubtagArgument,
    evaluator: SubtagArgument | string,
    val2Raw: SubtagArgument | string,
    codeRaw: SubtagArgument
): AsyncIterable<string> {
    while (context.return === 0) {

        let right = await val1Raw.execute();
        let operator = typeof evaluator === 'string' ? evaluator : await evaluator.execute();
        let left = typeof val2Raw === 'string' ? val2Raw : await val2Raw.execute();

        if (isComparisonOperator(operator)) {
            //operator = operator;
        } else if (isComparisonOperator(left)) {
            //operator = left;
            [left, operator] = [operator, left];
        } else if (isComparisonOperator(right)) {
            //operator = right;
            [operator, right] = [right, operator];
        }

        if (!isComparisonOperator(operator)) {
            //TODO invalid operator stuff here
            yield await codeRaw.execute();
        } else if (!operate(operator, right, left))
            break;
        else {
            yield await codeRaw.execute();
        }
    }
}
