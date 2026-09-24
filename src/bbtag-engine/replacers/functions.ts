import type { BBTagContext } from '../BBTagContext.js';
import { BBTagRuntimeError, NotEnoughArgumentsError, UnknownSubtagError } from '../BBTagRuntimeError.js';
import { defineReplacer } from '../defineReplacer.js';
import { parse } from '../parse.js';
import type { FunctionLocals } from './locals.js';

export const functionReplacer = defineReplacer<FunctionLocals>(['function', 'func'], {
    parameters: ['name', '~code'],
    returns: 'nothing',
    execute: function $function(ctx, [{ value: name }, { code }]) {
        const prefixedName = ensurePrefix('func.', name.toLowerCase());
        if (prefixedName === 'func.')
            throw new BBTagRuntimeError('Must provide a name');
        ctx.locals.functions[prefixedName] = code;
    }
});

export const funcReplacer = defineReplacer<FunctionLocals>(['func.'], {
    parameters: ['args*'],
    returns: 'string',
    execute: async function invokeFunction(ctx, args) {
        const prefixedName = ensurePrefix('func.', args.subtagName.toLowerCase());
        if (prefixedName !== args.subtagName)
            throw new UnknownSubtagError(args.subtagName);
        const source = ctx.locals.functions[prefixedName];
        if (source === undefined)
            throw new UnknownSubtagError(prefixedName);

        using _scope = ctx.pushScope();
        ctx.locals.functionParameters = args.map(arg => arg.value);
        return await ctx.eval(source);
    }
});

export const paramsReplacer = defineReplacer<FunctionLocals>(
    ['params'],
    {
        parameters: [],
        returns: 'string',
        execute: function allParams(ctx) {
            return requireParams(ctx, 'params').join(' ');
        }
    },
    {
        parameters: ['index'],
        returns: 'string',
        execute: function singleParam(ctx, [{ value: index }]) {
            const params = requireParams(ctx, 'params');
            const i = parse.int(index, { throw: true });
            if (params.length <= i || i < 0)
                throw new NotEnoughArgumentsError(i + 1, params.length);

            return params[i];
        }
    },
    {
        parameters: ['start', 'end'],
        returns: 'string',
        execute: function sliceParams(ctx, [{ value: start }, { value: end }]) {
            const params = requireParams(ctx, 'params');
            let from = parse.int(start, { throw: true });
            let to = end.toLowerCase() === 'n'
                ? params.length
                : parse.int(end, { throw: true });

            // TODO This behaviour should be documented
            [from, to] = [from, to].sort((a, b) => a - b);

            if (params.length <= from || from < 0)
                throw new NotEnoughArgumentsError(from + 1, params.length);

            return params.slice(from, to).join(' ');
        }
    }
);

export const paramsArrayReplacer = defineReplacer<FunctionLocals>('paramsArray', {
    parameters: [],
    returns: 'json[]',
    execute: function paramsArray(ctx) {
        return requireParams(ctx, 'paramsarray');
    }
});

export const paramsLengthReplacer = defineReplacer<FunctionLocals>('paramsLength', {
    parameters: [],
    returns: 'number',
    execute: function paramsLength(ctx) {
        return requireParams(ctx, 'paramslength').length;
    }
});

function requireParams(context: BBTagContext<FunctionLocals>, subtagName: string): readonly string[] {
    const params = context.locals.functionParameters;
    if (params === undefined)
        throw new BBTagRuntimeError(`{${subtagName}} can only be used inside {function}`);
    return params;
}

function ensurePrefix<Prefix extends string, Value extends string>(prefix: Prefix, value: Value): Value extends `${Prefix}${string}` ? Value : `${Prefix}${Value}`
function ensurePrefix(prefix: string, value: string): string {
    return value.startsWith(prefix) ? value : `${prefix}${value}`;
}
