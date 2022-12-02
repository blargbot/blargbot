import { createMapping } from './createMapping.js';
import { result } from './result.js';
import { TypeMapping } from './types.js';

export const mapString: TypeMapping<string> = createMapping(value => {
    switch (typeof value) {
        case 'string': return result.success(value);
        // fallthrough
        case 'number':
        case 'bigint': return result.success(value.toString());
    }
    return result.failed;
});
