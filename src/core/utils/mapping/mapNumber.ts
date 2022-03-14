import { TypeMapping } from '@blargbot/core/types';

import { createMapping } from './createMapping';
import { result } from './result';

export const mapNumber: TypeMapping<number> = createMapping(value => {
    return typeof value === 'number'
        ? result.success(value)
        : result.failed;
});
