import type { BBTagStatement } from '../BBTagStatement.js';
import type { SubtagSignatureValueParameter } from '../types.js';

export interface SubtagArgument {
    readonly parameter: SubtagSignatureValueParameter;
    readonly isCached: boolean;
    readonly value: string;
    readonly code: BBTagStatement;
    readonly raw: string;
    wait(): Awaitable<string>;
    execute(): Awaitable<string>;
}
