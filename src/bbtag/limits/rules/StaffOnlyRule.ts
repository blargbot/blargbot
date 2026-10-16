import { StaffOnlyError } from '../../errors/index.js';
import { templates } from '../../text.js';
import type { RuntimeLimitRule } from '../RuntimeLimitRule.js';

export const staffOnlyRule: RuntimeLimitRule = Object.seal({
    async check(context) {
        if (!await context.isStaff)
            throw new StaffOnlyError(context.root.authorizerId);
    },
    displayText() {
        return templates.limits.rules.staffOnly.default;
    },
    state() {
        return null;
    },
    load() {
        // NOOP
    }
});
