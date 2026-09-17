import type { BBTagContext } from './BBTagContext.js';
import type { BBTagRuntimeError } from './BBTagError.js';
import type { BBTagReplaceResult } from './BBTagReplaceResult.js';

export interface BBTagErrorRenderer<Locals extends Record<string, unknown>> {
    (context: BBTagContext<Locals>, error: BBTagRuntimeError): BBTagReplaceResult;
}
