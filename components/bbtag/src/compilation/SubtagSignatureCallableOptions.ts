import { SubtagArgumentArray } from '../arguments/index.js';
import { BBTagContext } from '../BBTagContext.js';
import { SubtagCall } from '../language/index.js';
import { SubtagReturnTypeMap } from '../types.js';
import { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions.js';

export interface SubtagSignatureCallableOptions<Type extends keyof SubtagReturnTypeMap> {
    readonly subtagName?: string;
    readonly parameters: readonly SubtagSignatureParameterOptions[];
    readonly returns: Type;
    readonly execute: (context: BBTagContext, args: SubtagArgumentArray, call: SubtagCall) => Awaitable<SubtagReturnTypeMap[Type]>;
}
