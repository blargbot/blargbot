import { SubtagCall } from '../language/index.js';
import { SubtagHandler } from './SubtagHandler.js';

export interface ConditionalSubtagHandler extends SubtagHandler {
    canHandle(call: SubtagCall, subtagName: string): boolean;
}
