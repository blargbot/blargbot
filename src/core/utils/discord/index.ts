import * as emojiString from './emojiString';
import * as getLimit from './getLimit';
import * as getMemberColor from './getMemberColor';
import * as getMemberPosition from './getMemberPosition';
import * as overflowText from './overflowText';

export { MessageComponent, MessageStringComponent } from './getLimit';

export const discord = {
    ...getLimit,
    ...emojiString,
    ...getMemberColor,
    ...getMemberPosition,
    ...overflowText
};
