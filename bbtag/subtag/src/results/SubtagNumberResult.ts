import { processResult } from '@bbtag/engine';

import type { SubtagResult } from './SubtagResult.js';

export default {
    execute(value) {
        return processResult(value.toString());
    }
} satisfies SubtagResult<number>;
