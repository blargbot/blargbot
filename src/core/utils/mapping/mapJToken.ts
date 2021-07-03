import { mappingResultNever } from './constants';
import { TypeMappingResult } from './types';

export function mapJToken(value: unknown): TypeMappingResult<JToken> {
    switch (typeof value) {
        case 'bigint':
        case 'symbol':
        case 'function': return mappingResultNever;
        case 'boolean':
        case 'number':
        case 'object':
        case 'string':
        case 'undefined': return { valid: true, value: value as JToken };
    }
}
