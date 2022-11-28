import { SubtagArgumentArray } from '../arguments';
import { BBTagContext } from '../BBTagContext';
import { SubtagCall } from '../language';

export interface SubtagLogic<T = AsyncIterable<string | undefined>> {
    execute(context: BBTagContext, args: SubtagArgumentArray, call: SubtagCall): T;
}
