import type { BBTagSubtag } from './language/BBTagSubtag.js';

export interface BBTagContextFrame {
    readonly name: string;
    readonly subtag: BBTagSubtag;
}
