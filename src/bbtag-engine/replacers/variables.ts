import { bbtagArray } from '../bbtagArray.js';
import { BBTagRuntimeError, NotANumberError } from '../BBTagRuntimeError.js';
import { defineReplacer } from '../defineReplacer.js';
import { parse } from '../parse.js';
import type { VariablesLocals } from './locals.js';

export const getReplacer = defineReplacer<VariablesLocals>('get', {
    parameters: ['name', 'index?'],
    returns: 'json|nothing',
    execute: async function getIndex(ctx, [{ value: name }, { value: indexStr }]) {
        const result = await ctx.locals.variables.get(name);
        if (!Array.isArray(result.value))
            return result.value;

        if (indexStr === '')
            return { v: result.value, n: result.key };

        const index = parse.int(indexStr, { throw: NotANumberError });
        if (index < 0 || index >= result.value.length)
            throw new BBTagRuntimeError('Index out of range');

        return result.value[index];
    }
});

export const setReplacer = defineReplacer<VariablesLocals>('set', {
    parameters: ['name', 'values*'],
    returns: 'nothing',
    execute: async function setArray(ctx, [{ value: name }, ...values]) {
        if (values.length === 0)
            await ctx.locals.variables.set(name, undefined);
        else if (values.length > 1)
            await ctx.locals.variables.set(name, values.map(v => v.value));
        else {
            const deserializedArray = bbtagArray.deserialize(values[0].value);
            if (deserializedArray !== undefined) {
                await ctx.locals.variables.set(name, deserializedArray.v);
            } else {
                await ctx.locals.variables.set(name, values[0].value);
            }
        }
    }
});

export const commitReplacer = defineReplacer<VariablesLocals>('commit', {
    parameters: ['variables*'],
    returns: 'nothing',
    execute: async function commitSome(ctx, variables) {
        if (variables.length === 0)
            await ctx.locals.variables.commit();
        else
            await ctx.locals.variables.commit(bbtagArray.flattenArray(variables.map(v => v.value)).map(v => parse.string(v)));
    }
});

export const rollbackReplacer = defineReplacer<VariablesLocals>('rollback', {
    parameters: ['variables*'],
    returns: 'nothing',
    execute: async function commitSome(ctx, variables) {
        if (variables.length === 0)
            await ctx.locals.variables.rollback();
        else
            await ctx.locals.variables.rollback(bbtagArray.flattenArray(variables.map(v => v.value)).map(v => parse.string(v)));
    }
});
