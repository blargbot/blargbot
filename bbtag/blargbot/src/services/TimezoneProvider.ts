import type { BBTagContext } from '../BBTagContext.js';

export interface TimezoneProvider {
    get(context: BBTagContext, userId: string): Promise<string | undefined>;
}
