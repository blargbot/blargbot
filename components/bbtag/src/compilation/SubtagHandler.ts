import { BBTagContext } from '../BBTagContext';
import { SubtagCall } from '../language';

export interface SubtagHandler {
    execute(context: BBTagContext, subtagName: string, call: SubtagCall): AsyncIterable<string | undefined>;
}
