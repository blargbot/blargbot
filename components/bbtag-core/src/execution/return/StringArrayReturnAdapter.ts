import { processResult } from '../../runtime/processResult.js';
import type { SubtagReturnAdapter } from '../SubtagReturnAdapter.js';

export default {
    getResult(value) {
        return processResult(JSON.stringify([...value]));
    }
} satisfies SubtagReturnAdapter<Iterable<string>>;
