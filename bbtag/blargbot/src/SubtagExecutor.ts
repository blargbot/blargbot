import type { BBTagCall } from './BBTagCall.js';
import type { BBTagScript } from './BBTagScript.js';
import type { ISubtag } from './ISubtag.js';

export interface SubtagExecutor {
    (subtag: ISubtag, script: BBTagScript, subtagName: string, call: BBTagCall): Awaitable<string>;
}
