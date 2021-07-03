import { RuntimeLimitRule } from '../../../types';
import { BBTagContext } from '../../BBTagContext';


export class StaffOnlyRule implements RuntimeLimitRule {
    public static readonly instance: StaffOnlyRule = new StaffOnlyRule();

    public async check(context: BBTagContext): Promise<boolean> {
        return await context.isStaff;
    }
    public errorText(): string {
        return 'Authorizer must be staff';
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
