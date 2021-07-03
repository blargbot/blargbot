import { TypeMapping } from '../../../workers/image/core';
import { mappingResultNever } from './constants';


export function mapInstanceof<T>(type: new (...args: unknown[]) => T): TypeMapping<T> {
    return value => {
        return value instanceof type
            ? { valid: true, value }
            : mappingResultNever;
    };
}
