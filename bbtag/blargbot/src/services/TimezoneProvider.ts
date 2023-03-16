import type { BBTagRuntime } from '../BBTagRuntime.js';

export interface TimezoneProvider {
    get(context: BBTagRuntime, userId: string): Promise<string | undefined>;
}
