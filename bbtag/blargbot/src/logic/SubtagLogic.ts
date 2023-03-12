import type { SubtagCall } from '@bbtag/language';

import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagContext } from '../BBTagContext.js';

export interface SubtagLogic<T = AsyncIterable<string | undefined>> {
    execute(context: BBTagContext, args: SubtagArgumentArray, call: SubtagCall): T;
}
