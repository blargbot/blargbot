import { SubtagDisabledError } from '../../errors/index.js';
import textTemplates from '../../text.js';
import type { RuntimeLimitRule } from '../RuntimeLimitRule.js';

export const disabledRule: RuntimeLimitRule = Object.seal({
    check(context, subtagName) {
        throw new SubtagDisabledError(subtagName, context.limit.id);
    },
    displayText(subtagName) {
        return textTemplates.limits.rules.disabled.default({ subtagName });
    },
    state() {
        return null;
    },
    load() {
        // NOOP
    }
});
