import type { BBTagContext } from '../BBTagContext.js';
import type { SubtagCall } from '../index.js';
import type { Subtag } from '../Subtag.js';

export interface SubtagInvocationMiddleware {
    (context: SubtagInvocationContext, next: () => AsyncIterable<string | undefined>): AsyncIterable<string | undefined>;
}

export interface SubtagInvocationContext {
    readonly subtag: Subtag;
    readonly context: BBTagContext;
    readonly subtagName: string;
    readonly call: SubtagCall;
}
