import type { BBTagContext } from '../BBTagContext.js';

export interface SourceProvider {
    get(context: BBTagContext, type: 'tag' | 'cc', name: string): Promise<{ content: string; cooldown?: number; } | undefined>;
}
