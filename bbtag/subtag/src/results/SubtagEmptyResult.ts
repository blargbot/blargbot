import { processResult } from '@bbtag/engine';

import type { SubtagResult } from './SubtagResult.js';

export default {
    execute() {
        return processResult('');
    }
} satisfies SubtagResult<void>;
