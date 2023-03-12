import type { SubtagCall } from '@bbtag/language';

import type { SubtagHandler } from './SubtagHandler.js';

export interface ConditionalSubtagHandler extends SubtagHandler {
    canHandle(call: SubtagCall, subtagName: string): boolean;
}
