import { createMapping } from './createMapping';
import { result } from './result';

export const mapNumber = createMapping<number>(value => {
    switch (typeof value) {
        case 'number':
            if (isNaN(value))
                return result.failed;
            return result.success(value);
        case 'string': {
            const res = parseFloat(value);
            if (isNaN(res))
                return result.failed;
            return result.success(res);
        }
        default:
            return result.failed;
    }
});
