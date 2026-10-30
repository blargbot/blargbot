import { StaffOnlyError, templates } from '@blargbot/bbtag-engine';
import { IsStaffSubtag } from '@blargbot/bbtag-engine/subtags';

import type { RuntimeLimitRule } from '../RuntimeLimitRule.js';

export const staffOnlyRule: RuntimeLimitRule = Object.seal({
    async check({ context }) {
        if (!await IsStaffSubtag.isStaff(context))
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
