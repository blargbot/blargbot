import type { BBTagContext } from '../BBTagContext.js';
import type { SubtagCall } from '../language/index.js';

export interface SubtagHandler {
    execute(context: BBTagContext, subtagName: string, call: SubtagCall): AsyncIterable<string | undefined>;
}
