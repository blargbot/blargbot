import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagSubtag } from '../../language/index.js';
import type { SubtagArgumentArray } from '../arguments/index.js';

export interface SubtagLogic<Locals extends Record<string, unknown>, T = AsyncIterable<string, void, void>> {
    (context: BBTagContext<Locals>, args: SubtagArgumentArray, bbtag: BBTagSubtag): T;
}
