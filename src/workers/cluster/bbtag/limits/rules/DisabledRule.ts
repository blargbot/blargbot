import { RuntimeLimitRule } from '@cluster/types';

export class DisabledRule implements RuntimeLimitRule {
    public static readonly instance: DisabledRule = new DisabledRule();

    public check(): boolean {
        return false;
    }
    public errorText(subtagName: string, scope: string): string {
        return `{${subtagName}} is disabled in ${scope}`;
    }
    public displayText(subtagName: string): string {
        return `{${subtagName}} is disabled`;
    }
    public state(): JToken {
        return null;
    }
    public load(): void {
        // NOOP
    }
}
