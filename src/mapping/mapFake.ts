import { result } from './result.js';
import type { TypeMappingResult } from './types.js';

export function mapFake<T>(value: unknown): TypeMappingResult<T> {
    return result.success(<T>value);
}
