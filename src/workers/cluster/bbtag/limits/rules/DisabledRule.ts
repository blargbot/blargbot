import { BBTagContext } from '@cluster/bbtag';
import { SubtagDisabledError } from '@cluster/bbtag/errors';
import { RuntimeLimitRule } from '@cluster/types';

export const disabledRule: RuntimeLimitRule = Object.seal({
    check(context: BBTagContext, subtagName: string): void {
        throw new SubtagDisabledError(subtagName, context.limit.scopeName);
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
