import type { BBTagSubtag } from './language/BBTagSubtag.js';

export interface BBTagError {
    readonly error: string;
    readonly display?: string;
    readonly details?: string;
}
export interface BBTagRuntimeError extends BBTagError {
    readonly subtag: BBTagSubtag;
}
