import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';
import type { ISubtag } from '../ISubtag.js';

export interface SubtagInvocationMiddleware {
    (context: SubtagInvocationContext, next: () => Awaitable<string>): Awaitable<string>;
}

export interface SubtagInvocationContext {
    readonly subtag: ISubtag;
    readonly script: BBTagScript;
    readonly subtagName: string;
    readonly call: BBTagCall;
}
