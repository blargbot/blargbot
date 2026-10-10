import type { BBTagReplacer } from '../BBTagReplacer.js';
import type { BBTagSubtag } from '../language/index.js';
import type { SubtagSignatureParameter } from '../types.js';

export interface ConditionalBBTagReplacer<Locals extends object> extends BBTagReplacer<Locals> {
    readonly id: string;
    readonly parameters: readonly SubtagSignatureParameter[];
    canHandle(call: BBTagSubtag, subtagName: string): boolean;
}
