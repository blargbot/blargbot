import { BBTagContext } from '../../BBTagContext';
import { SubtagDisabledError } from '../../errors';
import { RuntimeLimitRule } from '../../types';

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
