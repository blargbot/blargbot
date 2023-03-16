import type { BBTagCallToken } from '@bbtag/language';

import type { BBTagStatement } from './BBTagStatement.js';

export interface BBTagCall {
    readonly ast: BBTagCallToken;
    readonly name: BBTagStatement;
    readonly args: readonly BBTagStatement[];
    resolve(): Awaitable<string>;
}
