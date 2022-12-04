import type { SubtagCall } from '../language/index.js';
import type { SubtagHandler } from './SubtagHandler.js';

export interface ConditionalSubtagHandler extends SubtagHandler {
    canHandle(call: SubtagCall, subtagName: string): boolean;
}
