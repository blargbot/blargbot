import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';

export interface SubtagHandler {
    execute(context: BBTagScript, subtagName: string, call: BBTagCall): Awaitable<string>;
}
