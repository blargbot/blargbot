import { bbtagArray } from '../bbtagArray.js';
import type { BBTagContext } from '../BBTagContext.js';
import { cacheResult } from '../cacheResult.js';
import { toNaturalSortedBy } from '../compare.js';
import { defineReplacer } from '../defineReplacer.js';
import { parse } from '../parse.js';
import type { ArgsLocals, FallbackLocals, VariablesLocals } from './locals.js';

export const concatReplacer = defineReplacer('concat', {
    parameters: ['values+'],
    returns: 'json[]',
    execute: function concat(_, [...arrays]) {
        return bbtagArray.flattenArray(arrays.map(x => x.value));
    }
});
export const filterReplacer = defineReplacer<VariablesLocals>('filter', {
    parameters: ['variable', 'array#10000000', '~code'],
    returns: 'json[]',
    execute: async function* filter(ctx, [{ value: varName }, { value: source }, code]) {
        const array = await bbtagArray.deserializeOrGetIterable(ctx, source) ?? [];
        try {
            for (const item of array) {
                await ctx.locals.variables.set(varName, item);
                if (parse.boolean((await code.execute()).trim()) === true)
                    yield item;
            }
        } finally {
            ctx.locals.variables.rollback([varName]);
        }
    }
});
export const isArrayReplacer = defineReplacer('isArray', {
    parameters: ['text'],
    returns: 'boolean',
    execute: function isArray(_, [{ value }]) {
        return bbtagArray.deserialize(value) !== undefined;
    }
});
export const joinReplacer = defineReplacer<VariablesLocals>('join', {
    parameters: ['array', 'text'],
    returns: 'string',
    execute: async function join(context, [{ value: arrayStr }, { value: separator }]) {
        const { v: array } = await bbtagArray.deserializeOrGetArray(context, arrayStr, { throw: true });
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return array.join(separator);
    }
});
export const mapReplacer = defineReplacer<VariablesLocals>('map', {
    parameters: ['variable', 'array#10000000', '~code'],
    returns: 'string[]',
    execute: async function* map(context, [{ value: varName }, { value: arrayStr }, code]) {
        const array = await bbtagArray.deserializeOrGetIterable(context, arrayStr) ?? [];
        try {
            for (const item of array) {
                await context.locals.variables.set(varName, item);
                yield await code.execute();
            }
        } finally {
            context.locals.variables.rollback([varName]);
        }
    }
});
export const popReplacer = defineReplacer<VariablesLocals>('pop', {
    parameters: ['array'],
    returns: 'json|nothing',
    execute: async function pop(context, [{ value: arrayStr }]) {
        return await modifyArray(context, arrayStr, arr => arr.pop(), (_, v) => v);
    }
});
export const shiftReplacer = defineReplacer<VariablesLocals>('shift', {
    parameters: ['array'],
    returns: 'json|nothing',
    execute: async function shift(context, [{ value: arrayStr }]) {
        return await modifyArray(context, arrayStr, arr => arr.shift(), (_, v) => v);
    }
});
export const pushReplacer = defineReplacer<VariablesLocals>('push', {
    parameters: ['array', 'values+'],
    returns: 'json[]|nothing',
    execute: async function push(context, [{ value: arrayStr }, ...values]) {
        return await modifyArray(context, arrayStr, arr => arr.push(values.map(x => x.value)), x => x);
    }
});
export const unshiftReplacer = defineReplacer<VariablesLocals>('unshift', {
    parameters: ['array', 'values+'],
    returns: 'json[]|nothing',
    execute: async function unshift(context, [{ value: arrayStr }, ...values]) {
        return await modifyArray(context, arrayStr, arr => arr.unshift(values.map(x => x.value)), x => x);
    }
});
export const shuffleReplacer = defineReplacer<VariablesLocals & ArgsLocals>(
    'shuffle',
    {
        parameters: [],
        returns: 'nothing',
        execute: function shuffleArgs(ctx) {
            const items = [...ctx.locals.args.positional];
            shuffle(items);
            ctx.locals.args.positional = items;
        }
    },
    {
        parameters: ['array'],
        returns: 'json[]|nothing',
        execute: async function shuffleArray(ctx, [{ value: arrayStr }]) {
            return await modifyArray(ctx, arrayStr, shuffle, arr => arr);
        }
    }
);
export const sliceReplacer = defineReplacer<VariablesLocals & FallbackLocals>('slice', {
    parameters: ['array', 'start', 'end?:999999999999'],
    returns: 'json[]',
    execute: async function slice(ctx, [{ value: arrayStr }, { value: startStr }, { value: endStr }]) {
        const arr = await bbtagArray.deserializeOrGetArray(ctx, arrayStr, { throw: true });
        const fallback = cacheResult(() => parse.int(ctx.locals.fallback));

        const start = parse.int(startStr, { fallback, throw: true });
        const end = parse.int(endStr, { fallback, throw: true });
        return arr.v.slice(start, end);
    }
});
export const sortReplacer = defineReplacer<VariablesLocals>('sort', {
    parameters: ['array', 'descending?:false'],
    returns: 'json[]|nothing',
    execute: async function sort(ctx, [{ value: arrayStr }, { value: descendingStr }]) {
        return await modifyArray(ctx, arrayStr, arr => {
            const direction = parse.boolean(descendingStr, { fallback: descendingStr !== '' }) ? -1 : 1;
            const sorted = toNaturalSortedBy(arr, x => parse.string(x), direction);
            arr.splice(0, arr.length, ...sorted);
        }, x => x);
    }
});
export const spliceReplacer = defineReplacer<VariablesLocals & FallbackLocals>(
    'splice',
    {
        parameters: ['array', 'start', 'deleteCount?:0'],
        returns: 'json[]',
        execute: async function spliceDelete(ctx, [{ value: array }, { value: startStr }, { value: delCountStr }]) {
            return await modifyArray(ctx, array, arr => {
                const fallback = cacheResult(() => parse.int(ctx.locals.fallback));
                const start = parse.int(startStr, { fallback, throw: true });
                const delCount = parse.int(delCountStr, { fallback, throw: true });
                return arr.splice(start, delCount);
            }, (_, res) => res);
        }
    },
    {
        parameters: ['array', 'start', 'deleteCount:0', 'items+'],
        returns: 'json[]',
        execute: async function spliceReplace(ctx, [{ value: array }, { value: startStr }, { value: delCountStr }, ...items]) {
            return await modifyArray(ctx, array, arr => {
                const fallback = cacheResult(() => parse.int(ctx.locals.fallback));
                const start = parse.int(startStr, { fallback, throw: true });
                const delCount = parse.int(delCountStr, { fallback, throw: true });
                const insert = bbtagArray.flattenArray(items.map(x => x.value));
                return arr.splice(start, delCount, ...insert);
            }, (_, res) => res);
        }
    }
);
export const splitReplacer = defineReplacer('split', {
    parameters: ['text', 'splitter?'],
    returns: 'string[]',
    execute: function split(_, [{ value: text }, { value: splitter }]) {
        return text.split(splitter);
    }
});

async function modifyArray<State, Result>(
    context: BBTagContext<VariablesLocals>,
    arrayStr: string,
    modify: (arr: JArray) => State,
    getResult: (arr: JArray, res: State) => Result
): Promise<Result> {
    const { n: varName, v: array } = await bbtagArray.deserializeOrGetArray(context, arrayStr, { throw: true });

    const state = modify(array);
    if (varName !== undefined)
        await context.locals.variables.set(varName, array);

    return getResult(array, state);
}

function shuffle<T>(items: T[]): void {
    for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const swap = items[i];
        items[i] = items[j];
        items[j] = swap;
    }
}
