import { SubtagArgumentArray } from '../arguments/index.js';
import { BBTagContext } from '../BBTagContext.js';
import { SubtagCall } from '../language/index.js';

export interface SubtagLogic<T = AsyncIterable<string | undefined>> {
    execute(context: BBTagContext, args: SubtagArgumentArray, call: SubtagCall): T;
}
