import { SubtagCall } from '../language';
import { SubtagHandler } from './SubtagHandler';

export interface ConditionalSubtagHandler extends SubtagHandler {
    canHandle(call: SubtagCall): boolean;
}
