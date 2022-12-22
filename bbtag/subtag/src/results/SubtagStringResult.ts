import { processAsyncResult } from '@bbtag/engine';

import type { SubtagResult } from './SubtagResult.js';

export default {
    execute(value) {
        return processAsyncResult(value);
    }
} satisfies SubtagResult<Awaitable<string>>;
