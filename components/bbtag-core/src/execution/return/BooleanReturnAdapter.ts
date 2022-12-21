import { processResult } from '../../runtime/processResult.js';
import type { SubtagReturnAdapter } from '../SubtagReturnAdapter.js';

export default {
    getResult(value) {
        return processResult(value.toString());
    }
} satisfies SubtagReturnAdapter<boolean>;
