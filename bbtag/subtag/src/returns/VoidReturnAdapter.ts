import { processResult } from '@bbtag/engine';

import type { SubtagReturnAdapter } from './SubtagReturnAdapter.js';

export default {
    getResult() {
        return processResult('');
    }
} satisfies SubtagReturnAdapter<void>;
