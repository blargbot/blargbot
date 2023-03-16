import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';

export interface SubtagLogic<T = Awaitable<string>> {
    execute(context: BBTagScript, args: SubtagArgumentArray, call: BBTagCall): T;
}
