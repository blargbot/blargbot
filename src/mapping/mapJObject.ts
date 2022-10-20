import { createMapping } from './createMapping';
import { result } from './result';
import { TypeMapping } from './types';

export const mapJObject: TypeMapping<JObject> = createMapping(value => {
    switch (typeof value) {
        case 'object':
            if (!Array.isArray(value) && value !== null)
                return result.success(value as JObject);
        // fallthrough
        case 'bigint':
        case 'boolean':
        case 'function':
        case 'number':
        case 'string':
        case 'symbol':
        case 'undefined': return result.failed;
    }
});
