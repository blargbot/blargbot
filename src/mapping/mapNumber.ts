import { createMapping } from './createMapping';
import { result } from './result';
import { TypeMapping } from './types';

export const mapNumber: TypeMapping<number> = createMapping(value => {
    return typeof value === 'number'
        ? result.success(value)
        : result.failed;
});
