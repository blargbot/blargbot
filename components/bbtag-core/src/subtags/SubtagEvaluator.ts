import type { BBTagSubtagCall } from '../language/BBTagSubtagCall.js';
import type { BBTagScript } from '../runtime/BBTagScript.js';
import type { InterruptableProcess } from '../runtime/InterruptableProcess.js';

export interface SubtagEvaluator {
    execute(name: string, call: BBTagSubtagCall, script: BBTagScript): InterruptableProcess<string>;
}
