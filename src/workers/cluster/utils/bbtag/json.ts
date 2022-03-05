import { BBTagContext } from '@cluster/bbtag';
import { BBTagArray } from '@cluster/types';

import { getArray } from './tagArray';

export interface ReturnObject {
    variable?: string;
    object: JObject | JArray;
}

export async function resolve(context: BBTagContext, input: string): Promise<ReturnObject> {
    let obj: BBTagArray | JToken | undefined;
    let variable: string | undefined;
    const arr = await getArray(context, input);
    if (arr !== undefined) {
        obj = arr.v;
    } else {
        try {
            obj = JSON.parse(input);
        } catch (err: unknown) {
            const v = await context.variables.get(input);
            if (v.value !== undefined) {
                variable = input;
                if (typeof v.value === 'object')
                    obj = v.value;
                else {
                    try {
                        if (typeof v.value === 'string')
                            obj = JSON.parse(v.value);
                    } catch (err2: unknown) {
                        obj = {};
                    }
                }
            } else {
                obj = {};
            }
        }
    }
    if (typeof obj !== 'object' || obj === null)
        obj = {};
    return {
        variable,
        object: obj
    };
}

export function parseSync(input: string): JObject | JArray {
    let obj: BBTagArray | JToken;
    try {
        obj = JSON.parse(input);
    } catch (err: unknown) {
        obj = {};
    }

    if (typeof obj !== 'object' || obj === null)
        obj = {};
    return obj;
}
export function get(input: JObject | JArray, path: string | string[]): JToken | undefined {
    let obj: undefined | JToken = input;
    if (typeof path === 'string')
        path = path.split('.');
    for (const part of path) {
        if (typeof obj === 'string') {
            try {
                obj = JSON.parse(obj);
            } catch (err: unknown) {
                // NOOP
            }
        }

        if (typeof obj === 'object' && !Array.isArray(obj) && obj !== null) {
            const keys = Object.keys(obj);
            if (keys.length === 2 && keys.includes('v') && keys.includes('n') && /^\d+$/.test(part)) {
                obj = obj.v;
            }
        }
        if (obj === undefined)
            throw Error(`Cannot read property ${part} of undefined`);
        else if (obj === null)
            throw Error(`Cannot read property ${part} of null`);
        else if (typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, part)) {
            if (Array.isArray(obj))
                obj = obj[parseInt(part)];
            else
                obj = obj[part];
        } else if (typeof obj === 'string')
            obj = obj[parseInt(part)];
        else
            obj = undefined;
    }
    return obj;
}

export function set<T extends JObject | JArray>(input: T, path: string | string[], value: JToken | undefined, forceCreate = false): T {
    if (typeof path === 'string')
        path = path.split('.');
    const comps = path;
    let obj: undefined | JToken = input;
    if (forceCreate) {
        for (let i = 0; i < comps.length - 1; i++) {
            const p = comps[i];
            if (Object.prototype.hasOwnProperty.call(obj, p)) {
                let _c;
                if (Array.isArray(obj))
                    _c = obj[parseInt(p)];
                else if (typeof obj === 'object' && obj !== null)
                    _c = obj[p];
                // first ensure that it's not json encoded
                if (typeof _c === 'string') {
                    try {
                        _c = JSON.parse(_c);
                    } catch (err: unknown) {
                        // NOOP
                    }
                }
                // set to an object if it's a primative
                if (typeof _c !== 'object' || _c === null)
                    _c = {};
                if (Array.isArray(obj))
                    obj[parseInt(p)] = _c;
                else if (typeof obj === 'object' && obj !== null)
                    obj[p] = _c;
            } else if (Array.isArray(obj))
                obj[parseInt(p)] = {};
            else if (typeof obj === 'object' && obj !== null)
                obj[p] = {};

            if (Array.isArray(obj))
                obj = obj[parseInt(p)];
            else if (typeof obj === 'object' && obj !== null)
                obj = obj[p];
        }
    }
    obj = input;
    try {
        for (let i = 0; i < comps.length - 1; i++) {
            const p = comps[i];
            if (obj === null)
                throw Error(`Cannot set property ${p} of null`);

            if (Array.isArray(obj))
                obj = obj[parseInt(p)];
            else if (typeof obj === 'object')
                obj = obj[p];
        }
        const finalPart = comps[comps.length - 1];
        if (value === undefined) {
            if (Array.isArray(obj))
                obj.splice(parseInt(finalPart), 1);
            else if (typeof obj === 'object' && obj !== null)
                delete obj[finalPart];
        } else if (Array.isArray(obj))
            obj[parseInt(finalPart)] = value;
        else if (typeof obj === 'object' && obj !== null)
            obj[finalPart] = value;

    } catch (err: unknown) {
        if (err instanceof Error)
            throw err;
    }

    return input;
}

export function clean(input: JToken): JToken {
    if (typeof input === 'string') {
        try {
            // don't parse ints, because it will break snowflakes
            if (/^\d+$/.test(input)) {
                return input;
            }
            const raw = JSON.parse(input);

            return clean(raw);
        } catch (err: unknown) {
            return input;
        }
    } else if (Array.isArray(input)) {
        for (let i = 0; i < input.length; i++) {
            input[i] = clean(input[i]);
        }
    } else if (typeof input === 'object' && input !== null) {
        if ('n' in input && 'v' in input) {
            return clean(input.v);
        }

        for (const [key, value] of Object.entries(input))
            input[key] = clean(value);

    }
    return input;
}
