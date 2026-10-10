import type { ConditionalSubtagHandler } from './ConditionalSubtagHandler.js';
import type { SubtagHandler } from './SubtagHandler.js';

export interface CompositeSubtagHandler extends SubtagHandler {
    readonly handlers: readonly ConditionalSubtagHandler[];
}
