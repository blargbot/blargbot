import type { BBTagSubtagCall } from '@bbtag/language';

import type { InterruptableProcess } from '../InterruptableProcess.js';
import type { BBTagScript } from './BBTagScript.js';

export interface SubtagCallEvaluator {
    execute(name: string, call: BBTagSubtagCall, script: BBTagScript): InterruptableProcess<string>;
}
