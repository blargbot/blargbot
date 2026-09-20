import type { BBTagContext } from '../BBTagContext.js';
import type { BBTagSubtag } from '../language/index.js';
import type { SubtagReturnTypeMap } from '../types.js';
import type { SubtagArgumentArray } from './arguments/index.js';
import type { SubtagSignatureParameterOptions } from './SubtagSignatureParameterOptions.js';

export interface SubtagSignatureCallableOptions<Locals extends Record<string, unknown>, Type extends keyof SubtagReturnTypeMap> {
    readonly subtagName?: string;
    readonly parameters: readonly SubtagSignatureParameterOptions[];
    readonly returns: Type;
    readonly execute: (context: BBTagContext<Locals>, args: SubtagArgumentArray, call: BBTagSubtag) => Awaitable<SubtagReturnTypeMap[Type]>;
}
