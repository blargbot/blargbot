import { TypeMapping } from '@core/types';

import { result } from './result';

export function mapRegex<T extends string>(regex: RegExp): TypeMapping<T> {
    return (value: unknown) => {
        if (typeof value === 'string' && regex.test(value))
            return { valid: true, value: <T>value };
        return result.never;
    };
}
