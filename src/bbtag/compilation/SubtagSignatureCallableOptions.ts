import { SubtagArgumentArray } from '../arguments';
import { BBTagContext } from '../BBTagContext';
import { SubtagCall } from '../language';
import { SubtagReturnTypeMap } from '../types';
import { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions';

export interface SubtagSignatureCallableOptions<Type extends keyof SubtagReturnTypeMap> {
    readonly parameters: readonly SubtagSignatureParameterOptions[];
    readonly returns: Type;
    readonly execute: (context: BBTagContext, args: SubtagArgumentArray, call: SubtagCall) => Awaitable<SubtagReturnTypeMap[Type]>;
}
