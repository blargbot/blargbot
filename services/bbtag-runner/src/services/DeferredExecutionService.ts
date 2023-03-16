import type { BBTagScript, DeferredExecutionService as BBTagDeferredExecutionService } from '@bbtag/blargbot';

export class DeferredExecutionService implements BBTagDeferredExecutionService {
    public defer(context: BBTagScript, content: string, delayMs: number): Promise<void> {
        context;
        content;
        delayMs;
        throw new Error('Method not implemented.');
    }
}
