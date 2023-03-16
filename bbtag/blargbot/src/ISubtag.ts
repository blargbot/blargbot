import type { BBTagCall } from './BBTagCall.js';
import type { BBTagScript } from './BBTagScript.js';

export interface ISubtag {
    readonly id: string;
    readonly names: Iterable<string>;
    execute(script: BBTagScript, name: string, call: BBTagCall): Awaitable<string>;
}
