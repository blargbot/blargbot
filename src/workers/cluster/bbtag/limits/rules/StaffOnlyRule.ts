import { StaffOnlyError } from '@cluster/bbtag/errors';
import { RuntimeLimitRule } from '@cluster/types';

import { BBTagContext } from '../../BBTagContext';

export class StaffOnlyRule implements RuntimeLimitRule {
    public static readonly instance: StaffOnlyRule = new StaffOnlyRule();

    public async check(context: BBTagContext): Promise<void> {
        if (!await context.isStaff)
            throw new StaffOnlyError(context.authorizer);
    }
    public displayText(): string {
        return 'Authorizer must be staff';
    }
    public state(): JToken {
        return null;
    }
    public load(): void {
        // NOOP
    }
}
