import type { BBTagContext } from './BBTagContext.js';
import { NotAnArrayError } from './BBTagRuntimeError.js';
import { parse } from './parse.js';
import type { VariablesLocals } from './replacers/locals.js';
import type { BBTagArray } from './types.js';

export interface DeserializeOptions {
    throw?: boolean;
}

export const bbtagArray = Object.freeze({
    serialize(array: JArray | BBTagArray, varName?: string): string {
        if (Array.isArray(array)) {
            if (varName === undefined || varName.length === 0)
                return JSON.stringify(array);
            return JSON.stringify({ n: varName, v: array });
        }

        if (varName === undefined || varName.length === 0)
            return JSON.stringify(array);
        return JSON.stringify({
            v: 'v' in array ? array.v : undefined,
            n: varName
        });
    },
    deserialize,
    flattenArray(array: JArray): JArray {
        const result = [];
        for (const arg of array) {
            const arr = typeof arg === 'string' ? this.deserialize(arg) : undefined;
            if (arr !== undefined)
                result.push(...arr.v);
            else if (Array.isArray(arg))
                result.push(...arg);
            else
                result.push(arg);
        }
        return result;
    },
    deserializeOrGetArray,
    deserializeOrGetIterable,
    isTagArray(value: unknown): value is BBTagArray {
        return typeof value === 'object'
            && value !== null
            && 'v' in value
            && Array.isArray(value.v)
            && (!('n' in value) || typeof value.n === 'string');
    }
});

function deserialize(value: string, options: DeserializeOptions & { throw: true; }): BBTagArray
function deserialize(value: string, options?: DeserializeOptions): BBTagArray | undefined
function deserialize(value: string, options: DeserializeOptions = {}): BBTagArray | undefined {
    let result = tryParseAsBBTagArray(value);
    if (result === undefined) {
        value = value.replace(
            /(?<before>[[,]\s*)(?<start>\d+)\s*\.\.\.\s*(?<end>\d+)(?<after>\s*[\],])/gi,
            (_, ...args) => {
                const groups = args.at(-1) as Record<string, string>;
                const start = parse.int(groups.start) ?? NaN;
                const end = parse.int(groups.end) ?? NaN;
                const count = Math.max(0, Math.min(end - start, 200));
                return groups.before + Array.from({ length: count }, (_, i) => i + start).join(',') + groups.after;
            }
        );
        result = tryParseAsBBTagArray(value);
    }

    if (options.throw === true && result === undefined)
        throw new NotAnArrayError(value);

    return result;
}

async function deserializeOrGetArray(context: BBTagContext<VariablesLocals>, value: string, options: DeserializeOptions & { throw: true; }): Promise<BBTagArray>
async function deserializeOrGetArray(context: BBTagContext<VariablesLocals>, value: string, options?: DeserializeOptions): Promise<BBTagArray | undefined>
async function deserializeOrGetArray(context: BBTagContext<VariablesLocals>, value: string, options: DeserializeOptions = {}): Promise<BBTagArray | undefined> {
    const obj = bbtagArray.deserialize(value);
    if (obj !== undefined)
        return obj;

    const arr = await context.locals.variables.get(value);
    if (Array.isArray(arr.value))
        return { v: arr.value, n: arr.key };

    if (options.throw === true)
        throw new NotAnArrayError(value);

    return undefined;
}

async function deserializeOrGetIterable(context: BBTagContext<VariablesLocals>, value: string, options: DeserializeOptions & { throw: true; }): Promise<Iterable<JToken> | undefined>
async function deserializeOrGetIterable(context: BBTagContext<VariablesLocals>, value: string, options?: DeserializeOptions): Promise<Iterable<JToken> | undefined>
async function deserializeOrGetIterable(context: BBTagContext<VariablesLocals>, value: string, options: DeserializeOptions = {}): Promise<Iterable<JToken> | undefined> {
    const obj = bbtagArray.deserialize(value);
    if (obj !== undefined)
        return obj.v;

    const arr = await context.locals.variables.get(value);
    if (Array.isArray(arr.value) || typeof arr.value === 'string')
        return arr.value;

    if (options.throw === true)
        throw new NotAnArrayError(value);

    return undefined;
}

function tryParseAsBBTagArray(json: string): BBTagArray | undefined {
    try {
        const result = JSON.parse(json);
        if (bbtagArray.isTagArray(result))
            return result;
        if (Array.isArray(result))
            return { v: result };
        return undefined;
    } catch {
        return undefined;
    }
}
