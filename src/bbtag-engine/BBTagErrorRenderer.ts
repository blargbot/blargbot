import type { BBTagContext } from './BBTagContext.js';
import type { BBTagReplaceResult } from './BBTagReplaceResult.js';
import type { BBTagRuntimeError } from './BBTagRuntimeError.js';

export interface BBTagErrorRenderer<in Locals extends Record<string, unknown>> {
    (error: BBTagRuntimeError, context: BBTagContext<Locals>): BBTagReplaceResult;
}
