import { bbtagArray } from '../bbtagArray.js';
import type { BBTagContext } from '../BBTagContext.js';
import { BBTagRuntimeError, NotAnArrayError } from '../BBTagRuntimeError.js';
import { toNaturalSortedBy } from '../compare.js';
import { defineReplacer } from '../defineReplacer.js';
import { parse } from '../parse.js';
import type { VariablesLocals } from './locals.js';

export const jsonReplacer = defineReplacer(['json', 'j'], {
    parameters: ['~input?:{}'],
    returns: 'json',
    execute: function json(_, [{ raw: input }]) {
        return parseJson(input, { throw: true });
    }
});
export const jsonCleanReplacer = defineReplacer<VariablesLocals>(['jsonClean', 'jClean'], {
    parameters: ['input:{}'],
    returns: 'json',
    execute: async function jsonClean(ctx, [{ value: input }]) {
        const { object } = await resolveObj(ctx, input);
        return clean(object);
    }
});
export const jsonGetReplacer = defineReplacer<VariablesLocals>(
    ['jsonGet', 'jGet'],
    {
        parameters: ['input:{}#10000000'],
        returns: 'json|nothing',
        execute: async function jsonGet(ctx, [{ value: input }]) {
            return (await resolveObj(ctx, input)).object;
        }
    },
    {
        parameters: ['input:{}#10000000', 'path'],
        returns: 'json|nothing',
        execute: async function jsonGetPath(ctx, [{ value: input }, { value: path }]) {
            return await getPropPath(ctx, input, path);
        }
    }
);
export const jsonSetReplacer = defineReplacer<VariablesLocals>(
    ['jsonSet', 'jSet'],
    {
        parameters: ['input:{}', 'path'],
        returns: 'json|nothing',
        execute: async function jsonDelete(ctx, [{ value: input }, { value: path }]) {
            return await setPropPath(ctx, input, path, undefined, getProp);
        }
    },
    {
        parameters: ['input:{}', 'path', 'value'],
        returns: 'json|nothing',
        execute: async function jsonSet(ctx, [{ value: input }, { value: path }, { value }]) {
            return await setPropPath(ctx, input, path, value, getProp);
        }
    },
    {
        parameters: ['input:{}', 'path', 'value', 'create'],
        returns: 'json|nothing',
        execute: async function jsonSet(ctx, [{ value: input }, { value: path }, { value }]) {
            return await setPropPath(ctx, input, path, value, (obj, prop) => {
                let propVal = getProp(obj, prop);
                if (typeof propVal === 'string')
                    propVal = parseJson(propVal);
                if (typeof propVal !== 'object' || propVal === null)
                    propVal = {};
                setProp(obj, prop, propVal);
                return propVal;
            });
        }
    }
);
export const jsonKeysReplacer = defineReplacer<VariablesLocals>(['jsonKeys', 'jKeys'], {
    parameters: ['object:{}#10000000', 'path?'],
    returns: 'string[]',
    execute: async function jsonKeys(ctx, [{ value: input }, { value: path }]) {
        const value = await getPropPath(ctx, input, path);
        return Object.keys(value ?? {});
    }
});
export const jsonValuesReplacer = defineReplacer<VariablesLocals>(['jsonValues', 'jValues'], {
    parameters: ['object:{}#10000000', 'path?'],
    returns: 'json',
    execute: async function jsonValues(ctx, [{ value: input }, { value: path }]) {
        const value = await getPropPath(ctx, input, path);
        return Object.values(value ?? {});
    }
});
export const jsonSortReplacer = defineReplacer<VariablesLocals>(['jsonSort', 'jSort'], {
    parameters: ['array', 'path', 'descending?'],
    returns: 'json[]|nothing',
    execute: async function jsonSort(ctx, [{ value: input }, { value: pathStr }, { value: descStr }]) {
        const descending = parse.boolean(descStr) ?? descStr !== '';
        const obj = await resolveObj(ctx, input);
        if (!Array.isArray(obj.object))
            throw new NotAnArrayError(input);

        const path = pathStr.split('.');
        const orderMult = descending ? -1 : 1;

        const sortKeys = obj.object.map(item => path.reduce(getProp, item));
        const failed = sortKeys.filter(x => x === undefined).length;
        if (failed > 0)
            throw new BBTagRuntimeError(`Cannot read property ${pathStr} at index ${sortKeys.indexOf(undefined)}, ${failed} total failures`);
        const sorted = toNaturalSortedBy(obj.object, (_, i) => parse.string(sortKeys[i]), orderMult);

        if (obj.variable === undefined)
            return sorted;

        await ctx.locals.variables.set(obj.variable, sorted);
        return undefined;
    }
});
export const jsonStringifyReplacer = defineReplacer<VariablesLocals>(['jsonStringify', 'jStringify'], {
    parameters: ['input:{}', 'indent?:4'],
    returns: 'string',
    execute: async function jsonStringify(ctx, [{ value: input }, { value: indentStr }]) {
        const indent = parse.int(indentStr, { throw: true });
        const { object } = await resolveObj(ctx, input);
        return JSON.stringify(object, null, indent);
    }
});

interface JsonResolveResult {
    variable?: string;
    object: JObject | JArray;
}
async function resolveObj(context: BBTagContext<VariablesLocals>, input: string): Promise<JsonResolveResult> {
    let obj = parseJson(input);
    if (typeof obj === 'object' && obj !== null)
        return { variable: undefined, object: obj };

    const variable = await context.locals.variables.get(input);
    if (typeof variable.value === 'object' && variable.value !== null)
        return { variable: variable.key, object: variable.value };

    if (typeof variable.value !== 'string')
        return { variable: input, object: {} };

    obj = parseJson(variable.value);
    if (typeof obj === 'object' && obj !== null)
        return { variable: input, object: obj };

    return { variable: input, object: {} };
}
function parseJson(input: string, options: { throw: true; }): JToken
function parseJson(input: string, options?: { throw?: boolean; }): JToken | undefined
function parseJson(input: string, options: { throw?: boolean; } = {}): JToken | undefined {
    if (/^\d+/.test(input)) // Dont parse snowflakes
        return input;

    try {
        return JSON.parse(input);
    } catch {
        if (options.throw === true)
            throw new BBTagRuntimeError('Invalid JSON provided');
        return undefined;
    }
}
function clean(input: JToken): JToken {
    if (typeof input === 'string') {
        const json = parseJson(input);
        if (json !== undefined && json !== input)
            return clean(json);
    } else if (Array.isArray(input)) {
        for (let i = 0; i < input.length; i++) {
            input[i] = clean(input[i]);
        }
    } else if (typeof input === 'object' && input !== null) {
        if (bbtagArray.isTagArray(input))
            return clean(input.v);

        for (const [key, value] of Object.entries(input))
            input[key] = clean(value);

    }
    return input;
}
async function getPropPath(
    ctx: BBTagContext<VariablesLocals>,
    input: string,
    path: string
): Promise<JToken | undefined> {
    const { object } = await resolveObj(ctx, input);
    if (path === '')
        return object;
    return path.split('.')
        .reduce<JToken | undefined>((obj, part) => {
            if (typeof obj === 'string')
                obj = parseJson(obj) ?? obj;

            return getProp(obj, part);
        }, object);
}
async function setPropPath(
    ctx: BBTagContext<VariablesLocals>,
    input: string,
    path: string,
    value: JToken | undefined,
    getProp: (value: JToken, key: string) => JToken | undefined
): Promise<JToken | undefined> {
    const ref = await resolveObj(ctx, input);
    const segments = path.split('.');
    let target: JToken = ref.object;
    for (const segment of segments.slice(0, -1)) {
        const next = getProp(target, segment);
        if (next === undefined)
            break;
        target = next;
    }
    setProp(target, segments.at(-1)!, value);
    if (ref.variable === undefined)
        return ref.object;

    await ctx.locals.variables.set(ref.variable, ref.object);
    return undefined;
}
function getProp(target: JToken | undefined, prop: string): JToken | undefined {
    if (bbtagArray.isTagArray(target) && /^\d+$/.test(prop))
        target = target.v;

    switch (typeof target) {
        case 'undefined':
            throw new BBTagRuntimeError(`Cannot read property ${prop} of undefined`);
        case 'string':
            return getArrayProp(target, prop);
        case 'object':
            if (target === null)
                throw new BBTagRuntimeError(`Cannot read property ${prop} of null`);
            if (Array.isArray(target))
                return getArrayProp(target, prop);
            if (Object.prototype.hasOwnProperty.call(target, prop))
                return target[prop];
        //fallthrough
        default:
            return undefined;
    }
}
function setProp(target: JToken | undefined, prop: string, value: JToken | undefined): void {
    if (bbtagArray.isTagArray(target))
        target = target.v;

    switch (typeof target) {
        case 'undefined':
            throw new BBTagRuntimeError(`Cannot set property ${prop} on undefined`);
        case 'object':
            if (target === null)
                throw new BBTagRuntimeError(`Cannot set property ${prop} on null`);
            if (Array.isArray(target))
                return setArrayProp(target, prop, value);
            if (value === undefined)
                delete target[prop];
            else
                target[prop] = value;
            break;
        default:
            throw new BBTagRuntimeError(`Cannot set property ${prop} on ${JSON.stringify(target)}`);
    }
}
function getArrayProp<T>(arr: ArrayLike<T>, prop: string): T | number | undefined {
    const key = toArrayKey(prop);
    if (key === undefined)
        return undefined;
    return arr[key];
}
function setArrayProp<T>(arr: T[], prop: string, value: T): void {
    const key = toArrayKey(prop);
    if (key === undefined) {
        // NO-OP
    } else if (key === 'length') {
        if (value === undefined)
            arr.length = 0;
        if (typeof value !== 'number' || value < 0)
            throw new BBTagRuntimeError('Invalid array length');
        arr.length = value;
    } else if (value === undefined) {
        arr.splice(key, 1);
    } else {
        arr[key] = value;
    }
}
function toArrayKey(key: string): 'length' | number | undefined {
    if (key === 'length')
        return 'length';
    return parse.int(key);
}
