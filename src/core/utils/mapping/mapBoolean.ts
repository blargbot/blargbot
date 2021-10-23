import { createMapping } from './createMapping';
import { result } from './result';

export const mapBoolean = createMapping<boolean>(value => {
    return typeof value === 'boolean'
        ? result.success(value)
        : result.failed;
});
