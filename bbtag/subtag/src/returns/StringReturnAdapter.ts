import { processAsyncResult } from '@bbtag/engine';

import type { SubtagReturnAdapter } from './SubtagReturnAdapter.js';

export default {
    getResult(value) {
        return processAsyncResult(value);
    }
} satisfies SubtagReturnAdapter<Awaitable<string>>;
