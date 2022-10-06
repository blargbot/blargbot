import { createMapping } from './createMapping';
import { result } from './result';
import { TypeMapping } from './types';

export function mapRegex<T extends string>(regex: RegExp): TypeMapping<T> {
    return createMapping(value => {
        if (typeof value === `string` && regex.test(value))
            return result.success(<T>value);
        return result.failed;
    });
}
