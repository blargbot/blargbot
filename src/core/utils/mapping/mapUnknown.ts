import { TypeMapping } from '@blargbot/core/types';

import { createMapping } from './createMapping';
import { result } from './result';

export const mapUnknown: TypeMapping<unknown> = createMapping(value => result.success(value));
