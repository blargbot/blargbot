import { SubtagArgument } from '../arguments';
import { BBTagContext } from '../BBTagContext';
import { SubtagCall } from '../language';

export interface ArgumentResolver {
    readonly minArgs: number;
    readonly maxArgs: number;
    isExactMatch(subtag: SubtagCall): boolean;
    resolve(context: BBTagContext, subtagName: string, subtag: SubtagCall): Iterable<SubtagArgument>;
}
