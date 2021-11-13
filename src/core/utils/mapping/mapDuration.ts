import { TypeMapping } from '@core/types';
import { Duration, duration } from 'moment-timezone';

import { createMapping } from './createMapping';
import { result } from './result';

export const mapDuration: TypeMapping<Duration> = createMapping(value => {
    try {
        switch (typeof value) {
            case 'string':
            case 'object':
            case 'number': {
                const mapped = duration(value);
                if (mapped.isValid())
                    return result.success(mapped);
            }
        }
    } catch {
        // no-op
    }
    return result.failed;
});
