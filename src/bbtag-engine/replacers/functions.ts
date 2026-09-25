import { bbtagArray } from '../bbtagArray.js';
import type { BBTagContext } from '../BBTagContext.js';
import { BBTagRuntimeError, NotEnoughArgumentsError, UnknownSubtagError } from '../BBTagRuntimeError.js';
import { defineReplacer } from '../defineReplacer.js';
import { parseBBTag } from '../language/parseBBTag.js';
import { parse } from '../parse.js';
import type { ExecCustomCommandLocals, ExecTagLocals, FunctionLocals } from './locals.js';

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

export const injectReplacer = defineReplacer('inject', {
    parameters: ['code'],
    returns: 'string',
    execute: async function inject(context, [code]) {
        const ast = parseBBTag(code.value, { throw: true });
        const result = await context.eval(ast);
        if (context.returnDepth > 0)
            context.returnDepth--;
        return result;
    }
});

export const execTagReplacer = defineReplacer<ExecTagLocals>(['execTag', 'exec'], {
    parameters: ['name', 'args*'],
    returns: 'string',
    execute: async function execTag(ctx, [{ value: name }, ...args]) {
        const tagName = name;
        const tag = await ctx.locals.getTag(tagName);

        if (tag === undefined)
            throw new BBTagRuntimeError(`Tag not found: ${tagName}`);

        const input = args.length === 1
            ? splitArg(args[0].value)
            : bbtagArray.flattenArray(args.map(x => x.value)).map(x => parse.string(x));

        using _scope = ctx.pushScope();
        try {
            return await tag.execute(ctx, input);
        } finally {
            if (ctx.returnDepth > 0)
                ctx.returnDepth--;
        }
    }
});

export const execCustomCommandReplacer = defineReplacer<ExecCustomCommandLocals>(['execCustomCommand', 'execCC'], {
    parameters: ['name', 'args*'],
    returns: 'string',
    execute: async function execTag(ctx, [{ value: name }, ...args]) {
        const tagName = name;
        const tag = await ctx.locals.getCustomCommand(tagName);

        if (tag === undefined)
            throw new BBTagRuntimeError(`CCommand not found: ${tagName}`);

        const input = args.length === 1
            ? splitArg(args[0].value)
            : bbtagArray.flattenArray(args.map(x => x.value)).map(x => parse.string(x));

        using _scope = ctx.pushScope();
        try {
            return await tag.execute(ctx, input);
        } finally {
            if (ctx.returnDepth > 0)
                ctx.returnDepth--;
        }
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

function splitArg(source: string): string[] {
    const result: string[] = [];
    let i = 0;

    while (i < source.length) {
        while (source[i] === ' ') i++;

        if (i >= source.length) break;

        let end = -1;
        let quoted = source[i] === '"';
        if (quoted)
            end = findEnd(source, i + 1, isQuoteEnd, -1);
        if (end === -1) {
            quoted = false;
            end = findEnd(source, i, isSpace, source.length);
        }

        result.push(parseContent(source, quoted ? i + 1 : i, end));
        i = quoted ? end + 1 : end;
    }

    return result;
}

function findEnd(source: string, start: number, isEnd: (source: string, index: number) => boolean, eof: number): number {
    for (let i = start; i < source.length; i++) {
        if (source[i] === '\\')
            i++;
        else if (isEnd(source, i))
            return i;
    }

    return eof;
}

function parseContent(source: string, start: number, end: number): string {
    let value = '';

    for (let i = start; i < end; i++) {
        if (source[i] === '\\') {
            value += source.slice(start, i);
            start = i + 1;
        }
    }

    return value + source.slice(start, end);
}

function isSpace(source: string, index: number): boolean {
    return source[index] === ' ';
}
function isQuoteEnd(source: string, index: number): boolean {
    return source[index] === '"' && (source.length === index + 1 || source[index + 1] === ' ');
}
