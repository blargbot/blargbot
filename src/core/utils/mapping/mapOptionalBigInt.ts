import { TypeMappingResult } from '@core/types';

import { result } from './result';

export function mapOptionalBigInt(value: unknown): TypeMappingResult<bigint | undefined> {
    try {
        switch (typeof value) {
            case 'bigint': return { valid: true, value };
            case 'string':
            case 'number': return { valid: true, value: BigInt(value) };
            case 'undefined': return result.undefined;
            case 'object':
                if (value === null)
                    return result.undefined;
            // fallthrough
            default: return result.never;
        }
    } catch (e: unknown) {
        if (e instanceof RangeError)
            return result.never;
        throw e;
    }
}
