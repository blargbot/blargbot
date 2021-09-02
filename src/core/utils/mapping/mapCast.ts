import { TypeMappingResult } from '@core/types';

export function mapFake<T>(value: unknown): TypeMappingResult<T> {
    return { valid: true, value: <T>value };
}
