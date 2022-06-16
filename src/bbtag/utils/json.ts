import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../BBTagContext';
import { BBTagRuntimeError } from '../errors';
import { tagArray } from './tagArray';

export interface JsonResolveResult {
    variable?: string;
    object: JObject | JArray;
}

export const json = Object.freeze({
    async resolveObj(context: BBTagContext, input: string): Promise<JsonResolveResult> {
        let obj = this.parse(input);
        if (typeof obj === 'object' && obj !== null)
            return { variable: undefined, object: obj };

        const variable = await context.variables.get(input);
        if (typeof variable.value === 'object' && variable.value !== null)
            return { variable: input, object: variable.value };

        if (typeof variable.value !== 'string')
            return { variable: input, object: {} };

        obj = this.parse(variable.value);
        if (typeof obj === 'object' && obj !== null)
            return { variable: input, object: obj };

        return { variable: input, object: {} };
    },
    parseObj(input: string): JObject | JArray {
        let obj = this.parse(input) ?? {};
        if (typeof obj !== 'object')
            obj = {};

        return obj;
    },
    get(input: JToken | undefined, path: string | readonly string[]): JToken | undefined {
        return this.getPathKeys(path)
            .reduce((obj, part) => {
                if (typeof obj === 'string')
                    obj = this.parse(obj) ?? obj;

                return getProp(obj, part);
            }, input);
    },
    set(input: JToken | undefined, path: string | readonly string[], value: JToken | undefined, forceCreate = false): void {
        const pathKeys = this.getPathKeys(path);
        const container = pathKeys
            .slice(0, -1)
            .reduce(!forceCreate ? getProp : (obj, prop) => {
                let propVal = getProp(obj, prop);
                if (typeof propVal === 'string')
                    propVal = this.parse(propVal) ?? propVal;

                if (typeof propVal !== 'object' || propVal === null)
                    propVal = {};

                setProp(obj, prop, propVal);
                return propVal;
            }, input);

        const finalProp = pathKeys[pathKeys.length - 1];
        setProp(container, finalProp, value);
    },
    clean(input: JToken): JToken {
        if (typeof input === 'string') {
            const json = this.parse(input);
            if (json !== undefined && json !== input)
                return this.clean(json);
        } else if (Array.isArray(input)) {
            for (let i = 0; i < input.length; i++) {
                input[i] = this.clean(input[i]);
            }
        } else if (typeof input === 'object' && input !== null) {
            if (tagArray.isTagArray(input))
                return this.clean(input.v);

            for (const [key, value] of Object.entries(input))
                input[key] = this.clean(value);

        }
        return input;
    },
    getPathKeys(path: string | readonly string[]): readonly string[] {
        if (typeof path !== 'string')
            return path;
        if (path === '')
            return [];
        return path.split('.');
    },
    parse(value: string): JToken | undefined {
        if (/^\d+/.test(value)) // Dont parse snowflakes
            return value;

        try {
            return JSON.parse(value);
        } catch {
            return undefined;
        }
    }
});

function getProp(target: JToken | undefined, prop: string): JToken | undefined {
    if (tagArray.isTagArray(target) && /^\d+$/.test(prop))
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
    if (tagArray.isTagArray(target))
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
