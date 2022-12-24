import type { InterruptableProcess } from '@bbtag/engine';

import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const transparentResultAdapter = {
    execute(value) {
        return value;
    }
} satisfies SubtagResultAdapter<InterruptableProcess<string>>;
