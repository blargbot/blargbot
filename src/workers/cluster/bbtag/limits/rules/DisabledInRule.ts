import { BBTagContext } from '@cluster/bbtag';
import { RuntimeLimitRule } from '@cluster/types';

export class DisabledInRule implements RuntimeLimitRule {
    public constructor(private readonly disabledInSubtag: string) {
    }

    public check(context: BBTagContext): boolean {
        return !context.callStack.contains(this.disabledInSubtag);
    }

    public errorText(subtagName: string): string {
        return this.displayText(subtagName);
    }

    public displayText(subtagName: string): string {
        return `{${subtagName}} is disabled inside {${this.disabledInSubtag}}`;
    }

    public state(): JToken {
        return null;
    }

    public load(): void {
        // NOOP
    }
}
