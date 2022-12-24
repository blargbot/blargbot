import { processResult } from '@bbtag/engine';

import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const arrayResultAdapter = {
    execute(value) {
        return processResult(JSON.stringify([...value]));
    }
} satisfies SubtagResultAdapter<Iterable<unknown>>;
