import { RuntimeContext } from '../../RuntimeContext';
import { RuntimeLimitRule } from './RuntimeLimitRule';


export class StaffOnlyRule implements RuntimeLimitRule {
    public static readonly instance: StaffOnlyRule = new StaffOnlyRule();

    public async check(context: RuntimeContext): Promise<boolean> {
        return await context.isStaff;
    }
    public errorText(): string {
        return 'Authorizer must be staff';
    }
    public displayText(): string {
        return 'Authorizer must be staff';
    }
}