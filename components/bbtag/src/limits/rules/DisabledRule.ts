import { SubtagDisabledError } from '../../errors';
import templates from '../../text';
import { RuntimeLimitRule } from '../RuntimeLimitRule';

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
