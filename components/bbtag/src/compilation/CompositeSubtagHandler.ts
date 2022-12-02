import { ConditionalSubtagHandler } from './ConditionalSubtagHandler.js';
import { SubtagHandler } from './SubtagHandler.js';

export interface CompositeSubtagHandler extends SubtagHandler {
    readonly handlers: readonly ConditionalSubtagHandler[];
}
