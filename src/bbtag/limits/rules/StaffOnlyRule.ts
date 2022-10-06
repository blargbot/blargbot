import { BBTagContext } from '../../BBTagContext';
import { StaffOnlyError } from '../../errors';
import { RuntimeLimitRule } from '../RuntimeLimitRule';

export const staffOnlyRule: RuntimeLimitRule = Object.seal({
    async check(context: BBTagContext) {
        if (!await context.isStaff)
            throw new StaffOnlyError(context.authorizerId ?? context.guild.id);
    },
    displayText() {
        return `Authorizer must be staff`;
    },
    state() {
        return null;
    },
    load() {
        // NOOP
    }
});
