import type { BBTagCall } from '../BBTagCall.js';
import type { SubtagHandler } from './SubtagHandler.js';

export interface ConditionalSubtagHandler extends SubtagHandler {
    canHandle(call: BBTagCall, subtagName: string): boolean;
}
