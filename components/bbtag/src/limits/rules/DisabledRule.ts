import { SubtagDisabledError } from '../../errors/index.js';
import templates from '../../text.js';
import { RuntimeLimitRule } from '../RuntimeLimitRule.js';

export const disabledRule: RuntimeLimitRule = Object.seal({
    check(context, subtagName) {
        throw new SubtagDisabledError(subtagName, context.limit.id);
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
