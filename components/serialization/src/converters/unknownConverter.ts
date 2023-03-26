import type { IJsonConverter } from '../IJsonConverter.js';
import { makeJsonConverter } from '../makeJsonConverter.js';
import { failed, success } from '../result.js';

export const unknownConverter: IJsonConverter<unknown> = makeJsonConverter<unknown>({
    fromJson(value) {
        switch (typeof value) {
            case 'number': return success(value);
            case 'boolean': return success(value);
            case 'string': switch (value[0]) {
                case 'i': return success(BigInt(value.slice(1)));
                case 's': return success(value.slice(1));
                default: return failed('Cannot compute type from string');
            }
            case 'object': switch (value) {
                case null: return success(null);
                default: return success(Object.fromEntries(
                    Object.entries(value)
                        .map(([k, v]) => [k, unknownConverter.fromJson(v as JToken)])
                ));
            }
            default: return failed('Invalid value');
        }
    },
    test(value): value is unknown {
        value;
        return true;
    },
    toJson(value) {
        switch (typeof value) {
            case 'bigint': return `i${value}`;
            case 'string': return `s${value}`;
            case 'symbol': return undefined;
            case 'function': return undefined;
            case 'undefined': return undefined;
            case 'boolean': return value;
            case 'number': return value;
            case 'object':
                if (value === null)
                    return null;
                if (Array.isArray(value))
                    return value.map(v => unknownConverter.toJson(v));
                return Object.fromEntries(
                    Object.entries(value)
                        .map(([k, v]) => [k, unknownConverter.toJson(v)])
                );
        }
    }
});
