import type { SubtagCall } from '@bbtag/language';

import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagContext } from '../BBTagContext.js';
import type { SubtagReturnTypeMap } from '../types.js';
import type { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions.js';

export interface SubtagSignatureCallableOptions<Type extends keyof SubtagReturnTypeMap> {
    readonly subtagName?: string;
    readonly parameters: readonly SubtagSignatureParameterOptions[];
    readonly returns: Type;
    readonly execute: (context: BBTagContext, args: SubtagArgumentArray, call: SubtagCall) => Awaitable<SubtagReturnTypeMap[Type]>;
}
