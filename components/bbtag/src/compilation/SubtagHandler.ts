import { BBTagContext } from '../BBTagContext.js';
import { SubtagCall } from '../language/index.js';

export interface SubtagHandler {
    execute(context: BBTagContext, subtagName: string, call: SubtagCall): AsyncIterable<string | undefined>;
}
