import type { BBTagContext } from '../BBTagContext.js';
import type { BBTagSubtag } from '../language/index.js';
import type { SubtagArgument } from './arguments/index.js';

export interface ArgumentResolver<Locals extends object> {
    readonly minArgs: number;
    readonly maxArgs: number;
    isExactMatch(subtag: BBTagSubtag): boolean;
    resolve(context: BBTagContext<Locals>, subtag: BBTagSubtag): Iterable<SubtagArgument>;
}
