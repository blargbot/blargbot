import { mappingResultNever } from './constants';
import { TypeMapping } from './types';

export function mapInstanceof<T>(type: new (...args: unknown[]) => T): TypeMapping<T> {
    return value => {
        return value instanceof type
            ? { valid: true, value }
            : mappingResultNever;
    };
}
