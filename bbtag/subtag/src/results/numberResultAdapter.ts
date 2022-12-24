import { processResult } from '@bbtag/engine';

import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const numberResultAdapter = {
    execute(value) {
        return processResult(value.toString());
    }
} satisfies SubtagResultAdapter<number>;
