import type { TypeMappingResult } from './types.js';

export const result = {
    failed: { valid: false } as TypeMappingResult<never>,
    undefined: { valid: true, value: undefined } as TypeMappingResult<undefined>,
    null: { valid: true, value: null } as TypeMappingResult<null>,
    success<T>(value: T): TypeMappingResult<T> {
        return { valid: true, value };
    }
} as const;
