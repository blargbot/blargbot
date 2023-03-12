import type { SubtagCall } from '@bbtag/language';

import type { BBTagContext } from '../BBTagContext.js';

export interface SubtagHandler {
    execute(context: BBTagContext, subtagName: string, call: SubtagCall): AsyncIterable<string | undefined>;
}
