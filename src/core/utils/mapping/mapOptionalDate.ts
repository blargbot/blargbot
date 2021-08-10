import { TypeMappingResult } from '@core/types';
import moment from 'moment-timezone';

import { result } from './result';

export function mapOptionalDate(value: unknown): TypeMappingResult<Date | undefined> {
    switch (typeof value) {

        case 'undefined':
            return result.undefined;

        case 'string': {
            const success = moment(value);
            if (success.isValid())
                return { valid: true, value: success.toDate() };

            return result.never;
        }

        case 'object':
            if (value === null)
                return result.undefined;

            if (moment.isDate(value))
                return { valid: true, value };

            if (moment.isMoment(value))
                return { valid: true, value: value.toDate() };
        //fallthrough
        default:
            return result.never;
    }
}
