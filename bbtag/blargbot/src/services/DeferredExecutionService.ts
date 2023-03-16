import type { BBTagScript } from '../BBTagScript.js';

export interface DeferredExecutionService {
    defer(context: BBTagScript, content: string, delayMs: number): Promise<void>;
}
