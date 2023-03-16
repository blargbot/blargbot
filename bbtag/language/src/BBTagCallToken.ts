import type { BBTagStatementToken } from './BBTagStatementToken.js';
import type { BBTagToken } from './BBTagToken.js';

export interface BBTagCallToken extends BBTagToken {
    readonly name: BBTagStatementToken;
    readonly args: readonly BBTagStatementToken[];
}
