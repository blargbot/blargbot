import { TypeMappingResult } from '@core/types';

import { result } from './result';

export function mapFake<T>(value: unknown): TypeMappingResult<T> {
    return result.success(<T>value);
}
