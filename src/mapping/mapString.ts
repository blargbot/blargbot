import { createMapping } from './createMapping';
import { result } from './result';
import { TypeMapping } from './types';

export const mapString: TypeMapping<string> = createMapping(value => {
    switch (typeof value) {
        case `string`: return result.success(value);
        // fallthrough
        case `number`:
        case `bigint`: return result.success(value.toString());
    }
    return result.failed;
});
