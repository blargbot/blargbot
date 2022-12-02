import { createMapping } from './createMapping.js';
import { result } from './result.js';
import { TypeMapping } from './types.js';

export const mapUnknown: TypeMapping<unknown> = createMapping(value => result.success(value));
