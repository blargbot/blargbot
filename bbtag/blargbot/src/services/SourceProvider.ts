import type { BBTagRuntime } from '../BBTagRuntime.js';

export interface SourceProvider {
    get(context: BBTagRuntime, type: 'tag' | 'cc', name: string): Promise<{ content: string; cooldown: number; } | undefined>;
}
