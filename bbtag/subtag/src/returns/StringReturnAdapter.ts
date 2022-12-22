import { processResult } from '@bbtag/engine';

import type { SubtagReturnAdapter } from './SubtagReturnAdapter.js';

export default {
    getResult(value) {
        return processResult(value);
    }
} satisfies SubtagReturnAdapter<string>;
