import { TypeMappingResult } from '@core/types';

import { result } from './result';

export function mapJToken(value: unknown): TypeMappingResult<JToken> {
    switch (typeof value) {
        case 'bigint':
        case 'symbol':
        case 'function': return result.never;
        case 'boolean':
        case 'number':
        case 'object':
        case 'string':
        case 'undefined': return { valid: true, value: value as JToken };
    }
}
