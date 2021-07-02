import { isGuildChannel } from './isGuildChannel';
import { isTextableChannel } from './isTextableChannel';
import { isPrivateChannel } from './isPrivateChannel';
import { isPrivateMessage } from './isPrivateMessage';
import { isGuildRelated } from './isGuildRelated';
import { isGuildMessage } from './isGuildMessage';
import { notUndefined } from './notUndefined';
import { notNull } from './notNull';
import { hasValue } from './hasValue';
import { checkEmbedSize } from './checkEmbedSize';
import { isClass } from './isClass';
import { testMessageFilter } from './testMessageFilter';

export const guard = {
    isGuildChannel,
    isGuildMessage,
    isTextableChannel,
    isGuildRelated,
    isPrivateChannel,
    isPrivateMessage,
    notUndefined,
    notNull,
    hasValue,
    checkEmbedSize,
    isClass,
    testMessageFilter
};