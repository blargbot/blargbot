import type { BBTagReplacer } from '../BBTagReplacer.js';
import type { ConditionalBBTagReplacer } from './ConditionalBBTagReplacer.js';

export interface CompositeBBTagReplacer<Locals extends Record<string, unknown>> extends BBTagReplacer<Locals> {
    readonly names: readonly string[];
    readonly handlers: ReadonlyArray<ConditionalBBTagReplacer<Locals>>;
}
