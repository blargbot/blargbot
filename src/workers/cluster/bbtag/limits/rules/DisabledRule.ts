import { BBTagContext } from '@cluster/bbtag';
import { RuntimeLimitRule } from '@cluster/types';

export const disabledRule: RuntimeLimitRule = Object.seal({
    check(): boolean {
        return false;
    },
    errorText(subtagName: string, context: BBTagContext): string {
        return `{${subtagName}} is disabled in ${context.limit.scopeName}`;
    },
    displayText(subtagName: string): string {
        return `{${subtagName}} is disabled`;
    },
    state(): JToken {
        return null;
    },
    load(): void {
        // NOOP
    }
});
