import { bbtagArray } from '../bbtagArray.js';
import { BBTagRuntimeError } from '../BBTagRuntimeError.js';
import { defineReplacer } from '../defineReplacer.js';
import { parse } from '../parse.js';
import type { VariablesLocals } from './locals.js';

export const getReplacer = defineReplacer<VariablesLocals>(
    'get',
    {
        parameters: ['name'],
        returns: 'json|nothing',
        execute: async function get(ctx, [{ value: name }]) {
            const result = await ctx.locals.variables.get(name);
            if (!Array.isArray(result.value))
                return result.value;

            return { v: result.value, n: result.key };
        }
    },
    {
        parameters: ['name', 'index'],
        returns: 'json|nothing',
        execute: async function getIndex(ctx, [{ value: name }, { value: indexStr }]) {
            const result = await ctx.locals.variables.get(name);
            if (!Array.isArray(result.value))
                return result.value;

            if (indexStr === '')
                return { v: result.value, n: result.key };

            const index = parse.int(indexStr, { throw: true });
            if (index < 0 || index >= result.value.length)
                throw new BBTagRuntimeError('Index out of range');

            return result.value[index];
        }
    }
);

export const setReplacer = defineReplacer<VariablesLocals>(
    'set',
    {
        parameters: ['name'],
        returns: 'nothing',
        execute: async function setEmpty(ctx, [{ value: name }]) {
            await ctx.locals.variables.set(name, undefined);
        }
    },
    {
        parameters: ['name', 'value'],
        returns: 'nothing',
        execute: async function set(ctx, [{ value: name }, { value }]) {
            const deserializedArray = bbtagArray.deserialize(value);
            if (deserializedArray !== undefined) {
                await ctx.locals.variables.set(name, deserializedArray.v);
            } else {
                await ctx.locals.variables.set(name, value);
            }
        }
    },
    {
        parameters: ['name', 'values+2'],
        returns: 'nothing',
        execute: async function setArray(ctx, [{ value: name }, ...values]) {
            await ctx.locals.variables.set(name, values.map(v => v.value));
        }
    }
);

export const commitReplacer = defineReplacer<VariablesLocals>(
    'commit',
    {
        parameters: [],
        returns: 'nothing',
        execute: async function commitAll(ctx) {
            await ctx.locals.variables.commit();
        }
    },
    {
        parameters: ['variables+'],
        returns: 'nothing',
        execute: async function commitSome(ctx, variables) {
            await ctx.locals.variables.commit(variables.map(v => v.value));
        }
    }
);

export const rollbackReplacer = defineReplacer<VariablesLocals>(
    'rollback',
    {
        parameters: [],
        returns: 'nothing',
        execute: async function commitAll(ctx) {
            await ctx.locals.variables.rollback();
        }
    },
    {
        parameters: ['variables+'],
        returns: 'nothing',
        execute: async function commitSome(ctx, variables) {
            await ctx.locals.variables.rollback(variables.map(v => v.value));
        }
    }
);
