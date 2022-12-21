import { processResult } from '../../runtime/processResult.js';
import type { SubtagReturnAdapter } from '../SubtagReturnAdapter.js';

export default {
    getResult() {
        return processResult('');
    }
} satisfies SubtagReturnAdapter<void>;
