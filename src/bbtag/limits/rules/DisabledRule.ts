import { IFormattable, TranslatableString } from '@blargbot/domain/messages/index';

import { BBTagContext } from '../../BBTagContext';
import { SubtagDisabledError } from '../../errors';
import { RuntimeLimitRule } from '../RuntimeLimitRule';

const disabledMessage = TranslatableString.define<{ subtagName: string; }, string>('bbtag.limits.rules.disabled.default', '\\{{subtagName}\\} is disabled');

export const disabledRule: RuntimeLimitRule = Object.seal({
    check(context: BBTagContext, subtagName: string): void {
        throw new SubtagDisabledError(subtagName, context.limit.id);
    },
    displayText(subtagName: string): IFormattable<string> {
        return disabledMessage({ subtagName });
    },
    state(): JToken {
        return null;
    },
    load(): void {
        // NOOP
    }
});
