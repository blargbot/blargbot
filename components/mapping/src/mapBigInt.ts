import { createMapping } from './createMapping.js';
import { result } from './result.js';

export const mapBigInt = createMapping<bigint>(value => {
    try {
        switch (typeof value) {
            case 'bigint': return result.success(value);
            case 'string':
            case 'number': return result.success(BigInt(value));
            default: return result.failed;
        }
    } catch (e: unknown) {
        if (e instanceof RangeError)
            return result.failed;
        throw e;
    }
});
