import type { BBTagReplacer } from '../BBTagReplacer.js';
import type { BBTagSubtag } from '../language/index.js';
import type { SubtagSignatureParameter } from '../types.js';

export interface ConditionalBBTagReplacer<Locals extends Record<string, unknown>> extends BBTagReplacer<Locals> {
    readonly id: string;
    readonly subtagName: string | undefined;
    readonly parameters: readonly SubtagSignatureParameter[];
    canHandle(call: BBTagSubtag, subtagName: string): boolean;
}
