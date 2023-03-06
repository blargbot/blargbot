import type { BBTagContext, DeferredExecutionService as BBTagDeferredExecutionService } from '@bbtag/blargbot';

export class DeferredExecutionService implements BBTagDeferredExecutionService {
    public defer(context: BBTagContext, content: string, delayMs: number): Promise<void> {
        context;
        content;
        delayMs;
        throw new Error('Method not implemented.');
    }
}
