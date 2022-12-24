import { processResult } from '@bbtag/engine';

import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const booleanResultAdapter = {
    execute(value) {
        return processResult(value.toString());
    }
} satisfies SubtagResultAdapter<boolean>;
