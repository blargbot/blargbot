import type { BBTagContext } from '../BBTagContext.js';

export interface DeferredExecutionService {
    defer(context: BBTagContext, content: string, delayMs: number): Promise<void>;
}
