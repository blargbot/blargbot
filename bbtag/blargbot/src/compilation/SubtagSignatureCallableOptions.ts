import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';
import type { SubtagReturnTypeMap } from '../types.js';
import type { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions.js';

export interface SubtagSignatureCallableOptions<Type extends keyof SubtagReturnTypeMap> {
    readonly subtagName?: string;
    readonly parameters: readonly SubtagSignatureParameterOptions[];
    readonly returns: Type;
    readonly execute: (context: BBTagScript, args: SubtagArgumentArray, call: BBTagCall) => Awaitable<SubtagReturnTypeMap[Type]>;
}
