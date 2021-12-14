import { TypeMapping } from '@core/types';
import Long from 'long';

import { createMapping } from './createMapping';
import { result } from './result';

export const mapString: TypeMapping<string> = createMapping(value => {
    switch (typeof value) {
        case 'string': return result.success(value);
        case 'object': if (!(value instanceof Long)) break;
        // fallthrough
        case 'number':
        case 'bigint': return result.success(value.toString());
    }
    return result.failed;
});