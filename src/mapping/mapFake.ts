import { result } from './result';
import { TypeMappingResult } from './types';

export function mapFake<T>(value: unknown): TypeMappingResult<T> {
    return result.success(<T>value);
}
