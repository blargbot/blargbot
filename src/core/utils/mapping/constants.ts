import { TypeMappingResult } from './types';

export const mappingResultNever: TypeMappingResult<never> = { valid: false };
export const mappingResultUndefined: TypeMappingResult<undefined> = { valid: true, value: undefined };
export const mappingResultNull: TypeMappingResult<null> = { valid: true, value: null };
