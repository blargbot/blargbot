import { TypeMappingResult } from '@core/types';

import { result } from './result';

export function mapBigInt(value: unknown): TypeMappingResult<bigint> {
    try {
        switch (typeof value) {
            case 'bigint': return { valid: true, value };
            case 'string':
            case 'number': return { valid: true, value: BigInt(value) };
            default: return result.never;
        }
    } catch (e: unknown) {
        if (e instanceof RangeError)
            return result.never;
        throw e;
    }
}
