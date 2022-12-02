import moment from 'moment-timezone';

import { createMapping } from './createMapping.js';
import { result } from './result.js';
import { TypeMapping } from './types.js';

export const mapDuration: TypeMapping<moment.Duration> = createMapping(value => {
    try {
        switch (typeof value) {
            case 'string':
            case 'object':
            case 'number': {
                const mapped = moment.duration(value);
                if (mapped.isValid())
                    return result.success(mapped);
            }
        }
    } catch {
        // NOOP
    }
    return result.failed;
});
