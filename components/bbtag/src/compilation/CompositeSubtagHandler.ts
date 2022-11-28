import { ConditionalSubtagHandler } from './ConditionalSubtagHandler';
import { SubtagHandler } from './SubtagHandler';

export interface CompositeSubtagHandler extends SubtagHandler {
    readonly handlers: readonly ConditionalSubtagHandler[];
}
