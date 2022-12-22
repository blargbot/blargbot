import { processResult } from '@bbtag/engine';

import type { SubtagReturnAdapter } from './SubtagReturnAdapter.js';

export default {
    getResult(value) {
        return processResult(JSON.stringify([...value]));
    }
} satisfies SubtagReturnAdapter<Iterable<string>>;
