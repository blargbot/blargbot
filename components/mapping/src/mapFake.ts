import { result } from './result.js';
import { TypeMappingResult } from './types.js';

export function mapFake<T>(value: unknown): TypeMappingResult<T> {
    return result.success(<T>value);
}
