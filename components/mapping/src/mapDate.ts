import moment from 'moment-timezone';

import { createMapping } from './createMapping.js';
import { result } from './result.js';
import type { TypeMapping } from './types.js';

export const mapDate: TypeMapping<Date> = createMapping(value => {
    switch (typeof value) {
        case 'string': {
            const mapped = moment(value);
            if (mapped.isValid())
                return result.success(mapped.toDate());

            return result.failed;
        }

        case 'object':
            if (value === null)
                return result.failed;

            if (moment.isDate(value))
                return result.success(value);

            if (moment.isMoment(value))
                return result.success(value.toDate());
        //fallthrough
        default:
            return result.failed;
    }
});
