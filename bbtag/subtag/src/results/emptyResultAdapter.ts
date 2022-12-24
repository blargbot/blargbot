import { processResult } from '@bbtag/engine';

import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const emptyResultAdapter = {
    execute() {
        return processResult('');
    }
} satisfies SubtagResultAdapter<void>;
