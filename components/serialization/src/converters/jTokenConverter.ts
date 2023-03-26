import type { IJsonConverter } from '../IJsonConverter.js';
import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const jTokenConverter: IJsonConverter<JToken> = makeJsonConverter<JToken>({
    fromJson(value) {
        switch (typeof value) {
            case 'number': return success(value);
            case 'boolean': return success(value);
            case 'string': return success(value);
            case 'object': {
                if (value === null)
                    return success(null);
                if (Array.isArray(value)) {
                    const result = [];
                    for (const element of value) {
                        const res = jTokenConverter.fromJson(element);
                        if (!res.success)
                            return res;
                        result.push(res.value);
                    }
                    return success(result);
                }
                const result: JObject = {};
                for (const [k, v] of Object.entries(value)) {
                    const res = jTokenConverter.fromJson(v);
                    if (!res.success)
                        return res;
                    result[k] = res.value;
                }
                return success(result);
            }
            default: return failed('Invalid value');
        }
    },
    test(value): value is JToken {
        switch (typeof value) {
            case 'string': return true;
            case 'number': return true;
            case 'bigint': return false;
            case 'boolean': return true;
            case 'symbol': return false;
            case 'function': return false;
            case 'undefined': return false;
            case 'object':
                if (value === null)
                    return true;
                if (Array.isArray(value))
                    return value.every(v => jTokenConverter.test(v ?? null));
                return Object.values(value)
                    .every((v: unknown) => v === undefined || jTokenConverter.test(v));
        }
    },
    toJson(value) {
        switch (typeof value) {
            case 'bigint': return undefined;
            case 'string': return value;
            case 'symbol': return undefined;
            case 'function': return undefined;
            case 'undefined': return undefined;
            case 'boolean': return value;
            case 'number': return value;
            case 'object':
                if (value === null)
                    return null;
                if (Array.isArray(value))
                    return value.map(v => jTokenConverter.toJson(v)) as JArray;
                return Object.fromEntries(
                    Object.entries(value)
                        .map(([k, v]) => [k, jTokenConverter.toJson(v)])
                ) as JObject;
        }
    }
});
