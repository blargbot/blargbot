import { createMapping } from './createMapping';
import { result } from './result';
import { TypeMapping } from './types';

export const mapUnknown: TypeMapping<unknown> = createMapping(value => result.success(value));
