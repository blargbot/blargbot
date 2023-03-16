import type { BBTagStatementToken } from '@bbtag/language';

export interface BBTagStatement {
    readonly ast: BBTagStatementToken;
    readonly isEmpty: boolean;
    resolve(): Awaitable<string>;
}
