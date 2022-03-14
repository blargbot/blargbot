import { StaffOnlyError } from '@blargbot/cluster/bbtag/errors';
import { RuntimeLimitRule } from '@blargbot/cluster/types';

import { BBTagContext } from '../../BBTagContext';

export const staffOnlyRule: RuntimeLimitRule = Object.seal({
    async check(context: BBTagContext) {
        if (!await context.isStaff)
            throw new StaffOnlyError(context.authorizerId);
    },
    displayText() {
        return 'Authorizer must be staff';
    },
    state() {
        return null;
    },
    load() {
        // NOOP
    }
});
