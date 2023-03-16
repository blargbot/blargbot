import type { BBTagCallToken } from './BBTagCallToken.js';
import type { BBTagToken } from './BBTagToken.js';

export interface BBTagStatementToken extends BBTagToken {
    readonly values: ReadonlyArray<string | BBTagCallToken>;
}
