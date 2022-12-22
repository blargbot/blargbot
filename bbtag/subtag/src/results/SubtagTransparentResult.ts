import type { InterruptableProcess } from '@bbtag/engine';

import type { SubtagResult } from './SubtagResult.js';

export default {
    execute(value) {
        return value;
    }
} satisfies SubtagResult<InterruptableProcess<string>>;
