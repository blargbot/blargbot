import { TranslatableString } from '@blargbot/domain/messages/index';

import { BBTagContext } from '../../BBTagContext';
import { StaffOnlyError } from '../../errors';
import { RuntimeLimitRule } from '../RuntimeLimitRule';

const notStaffError = TranslatableString.create(`bbtag.limits.rules.notStagg.default`, `Authorizer must be staff`);

export const staffOnlyRule: RuntimeLimitRule = Object.seal({
    async check(context: BBTagContext) {
        if (!await context.isStaff)
            throw new StaffOnlyError(context.authorizerId ?? context.guild.id);
    },
    displayText() {
        return notStaffError;
    },
    state() {
        return null;
    },
    load() {
        // NOOP
    }
});
