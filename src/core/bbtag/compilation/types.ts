import { SubtagArgumentValue } from '../arguments';
import { BBTagContext } from '../BBTagContext';
import { Statement, SubtagCall, SubtagHandlerParameter, SubtagResult } from '../types';

export type SubHandler = (context: BBTagContext, subtagName: string, call: SubtagCall) => Promise<SubtagResult>;
export type ArgumentResolver = (context: BBTagContext, args: readonly Statement[]) => AsyncGenerator<SubtagArgumentValue>;

export interface SubHandlerCollection {
    byNumber: { [argLength: number]: SubHandler };
    byTest: Array<{
        execute: SubHandler,
        test: (argCount: number) => boolean
    }>;
}

export interface ArgumentResolvers {
    byNumber: { [argLength: number]: ArgumentResolver };
    byTest: Array<{
        resolver: ArgumentResolver,
        test: (argCount: number) => boolean, minArgCount: number, maxArgCount: number,
    }>;
}

export interface ArgumentResolverPermutations {
    greedy: SubtagHandlerParameter[];
    permutations: Array<{
        beforeGreedy: SubtagHandlerParameter[],
        afterGreedy: SubtagHandlerParameter[]
    }>;
}