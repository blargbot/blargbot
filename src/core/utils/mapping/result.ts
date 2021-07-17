import { TypeMappingResult } from '@core/types';

export const result = {
    never: { valid: false } as TypeMappingResult<never>,
    undefined: { valid: true, value: undefined } as TypeMappingResult<undefined>,
    null: { valid: true, value: null } as TypeMappingResult<null>
} as const;
