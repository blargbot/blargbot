import { processAsyncResult } from '@bbtag/engine';

import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const stringResultAdapter = {
    execute(value) {
        return processAsyncResult(value);
    }
} satisfies SubtagResultAdapter<Awaitable<string>>;
