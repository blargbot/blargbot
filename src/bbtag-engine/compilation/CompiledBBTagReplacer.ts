import type { BBTagReplacer } from '../BBTagReplacer.js';
import type { ConditionalBBTagReplacer } from './ConditionalBBTagReplacer.js';

export interface CompiledBBTagReplacer<Locals extends object> extends BBTagReplacer<Locals> {
    readonly handlers: ReadonlyArray<ConditionalBBTagReplacer<Locals>>;
}
