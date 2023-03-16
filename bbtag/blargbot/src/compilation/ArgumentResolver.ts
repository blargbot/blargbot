import type { SubtagArgument } from '../arguments/index.js';
import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';

export interface ArgumentResolver {
    readonly minArgs: number;
    readonly maxArgs: number;
    isExactMatch(subtag: BBTagCall): boolean;
    resolve(context: BBTagScript, subtag: BBTagCall): Iterable<SubtagArgument>;
}
