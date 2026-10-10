import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagContext } from '../BBTagContext.js';
import type { SubtagCall } from '../language/index.js';

export interface SubtagLogic<T = AsyncIterable<string | undefined>> {
    execute(context: BBTagContext, args: SubtagArgumentArray, call: SubtagCall): T;
}
