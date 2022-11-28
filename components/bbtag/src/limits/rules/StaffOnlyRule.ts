import { StaffOnlyError } from '../../errors';
import templates from '../../text';
import { RuntimeLimitRule } from '../RuntimeLimitRule';

export const staffOnlyRule: RuntimeLimitRule = Object.seal({
    async check(context) {
        if (!await context.isStaff)
            throw new StaffOnlyError(context.authorizerId ?? context.guild.id);
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
