import { processResult } from '@bbtag/engine';

import type { SubtagResult } from './SubtagResult.js';

export default {
    execute(value) {
        return processResult(JSON.stringify([...value]));
    }
} satisfies SubtagResult<Iterable<unknown>>;
