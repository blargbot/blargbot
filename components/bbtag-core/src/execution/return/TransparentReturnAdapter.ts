import type { InterruptableProcess } from '../../runtime/InterruptableProcess.js';
import type { SubtagReturnAdapter } from '../SubtagReturnAdapter.js';

export default {
    getResult(value) {
        return value;
    }
} satisfies SubtagReturnAdapter<InterruptableProcess<string>>;
