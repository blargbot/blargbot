import { createMapping } from './createMapping.js';
import { result } from './result.js';

export const mapBoolean = createMapping<boolean>(value => {
    switch (typeof value) {
        case 'boolean':
            return result.success(value);
        case 'string':
            switch (value.toLowerCase()) {
                case 'true':
                    return result.success(true);
                case 'false':
                    return result.success(false);
            }
            break;
    }
    return result.failed;
});
