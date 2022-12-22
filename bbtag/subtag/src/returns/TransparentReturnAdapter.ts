import type { InterruptableProcess } from '@bbtag/engine';

import type { SubtagReturnAdapter } from './SubtagReturnAdapter.js';

export default {
    getResult(value) {
        return value;
    }
} satisfies SubtagReturnAdapter<InterruptableProcess<string>>;
