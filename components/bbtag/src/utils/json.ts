import type { BBTagContext } from '../BBTagContext.js';
import { BBTagRuntimeError } from '../errors/index.js';
import type { BBTagArrayTools } from './tagArray.js';

export interface JsonResolveResult {
    variable?: string;
    object: JObject | JArray;
}

export interface BBTagJsonTools {
    resolveObj(this: void, context: BBTagContext, input: string): Promise<JsonResolveResult>;
    get(this: void, input: JToken | undefined, path: string | readonly string[]): JToken | undefined;
    set(this: void, input: JToken | undefined, path: string | readonly string[], value: JToken | undefined, forceCreate?: boolean): void;
    clean(this: void, input: JToken): JToken;
    getPathKeys(this: void, path: string | readonly string[]): readonly string[];
    parse(this: void, value: string): JToken | undefined;
}

export interface BBTagJsonToolsOptions {
    convertToInt: (value: string) => number | undefined;
    isTagArray: BBTagArrayTools['isTagArray'];
}

export function createBBTagJsonTools(options: BBTagJsonToolsOptions): BBTagJsonTools {
    const tools: BBTagJsonTools = {
        async resolveObj(context, input) {
            let obj = tools.parse(input);
            if (typeof obj === 'object' && obj !== null)
                return { variable: undefined, object: obj };

            const variable = await context.variables.get(input);
            if (typeof variable.value === 'object' && variable.value !== null)
                return { variable: input, object: variable.value };

            if (typeof variable.value !== 'string')
                return { variable: input, object: {} };

            obj = tools.parse(variable.value);
            if (typeof obj === 'object' && obj !== null)
                return { variable: input, object: obj };

            return { variable: input, object: {} };
        },
        get(input, path) {
            return tools.getPathKeys(path)
                .reduce((obj, part) => {
                    if (typeof obj === 'string')
                        obj = tools.parse(obj) ?? obj;

                    return getProp(obj, part);
                }, input);
        },
        set(input, path, value, forceCreate = false) {
            const pathKeys = tools.getPathKeys(path);
            const container = pathKeys
                .slice(0, -1)
                .reduce(!forceCreate ? getProp : (obj, prop) => {
                    let propVal = getProp(obj, prop);
                    if (typeof propVal === 'string')
                        propVal = tools.parse(propVal) ?? propVal;

                    if (typeof propVal !== 'object' || propVal === null)
                        propVal = {};

                    setProp(obj, prop, propVal);
                    return propVal;
                }, input);

            const finalProp = pathKeys[pathKeys.length - 1];
            setProp(container, finalProp, value);
        },
        clean(input) {
            if (typeof input === 'string') {
                const json = tools.parse(input);
                if (json !== undefined && json !== input)
                    return tools.clean(json);
            } else if (Array.isArray(input)) {
                for (let i = 0; i < input.length; i++) {
                    input[i] = tools.clean(input[i]);
                }
            } else if (typeof input === 'object' && input !== null) {
                if (options.isTagArray(input))
                    return tools.clean(input.v);

                for (const [key, value] of Object.entries(input))
                    input[key] = tools.clean(value);

            }
            return input;
        },
        getPathKeys(path) {
            if (typeof path !== 'string')
                return path;
            return path.split('.');
        },
        parse(value) {
            if (/^\d+/.test(value)) // Dont parse snowflakes
                return value;

            try {
                return JSON.parse(value);
            } catch {
                return undefined;
            }
        }
    };

    return tools;

    function getProp(target: JToken | undefined, prop: string): JToken | undefined {
        if (options.isTagArray(target) && /^\d+$/.test(prop))
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
        if (options.isTagArray(target))
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
        return options.convertToInt(key);
    }
}
