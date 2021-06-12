import { isGuildChannel } from './isGuildChannel';
import { isTextableChannel } from './isTextableChannel';
import { isGuildCommandContext } from './isGuildCommandContext';
import { isPrivateCommandContext } from './isPrivateCommandContext';
import { isPrivateChannel } from './isPrivateChannel';
import { isPrivateMessage } from './isPrivateMessage';
import { isGuildRelated } from './isGuildRelated';
import { isGuildMessage } from './isGuildMessage';
import { notUndefined } from './notUndefined';
import { notNull } from './notNull';
import { hasValue } from './hasValue';
import { isGuildSetting } from './isGuildSetting';
import { checkEmbedSize } from './checkEmbedSize';
import { isClass } from './isClass';
import { testMessageFilter } from './testMessageFilter';
export { MessageFilter } from './testMessageFilter';

export const guard = {
    isGuildChannel,
    isGuildMessage,
    isTextableChannel,
    isGuildCommandContext,
    isGuildRelated,
    isPrivateCommandContext,
    isPrivateChannel,
    isPrivateMessage,
    notUndefined,
    notNull,
    hasValue,
    isGuildSetting,
    checkEmbedSize,
    isClass,
    testMessageFilter
};