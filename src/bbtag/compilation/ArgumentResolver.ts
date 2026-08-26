import type { SubtagArgument } from '../arguments/index.js';
import type { BBTagContext } from '../BBTagContext.js';
import type { SubtagCall } from '../language/index.js';

export interface ArgumentResolver {
    readonly minArgs: number;
    readonly maxArgs: number;
    isExactMatch(subtag: SubtagCall): boolean;
    resolve(context: BBTagContext, subtag: SubtagCall): Iterable<SubtagArgument>;
}
