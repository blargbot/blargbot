import { SubtagDisabledError, templates } from '@blargbot/bbtag';

import type { RuntimeLimitRule } from '../RuntimeLimitRule.js';

export const disabledRule: RuntimeLimitRule = Object.seal({
    check(context, subtagName) {
        throw new SubtagDisabledError(subtagName, context.limit.type);
    },
    displayText(subtagName) {
        return templates.limits.rules.disabled.default({ subtagName });
    },
    state() {
        return null;
    },
    load() {
        // NOOP
    }
});
