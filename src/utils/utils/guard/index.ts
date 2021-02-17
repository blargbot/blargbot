import { isGuildChannel } from './isGuildChannel';
import { isTextableChannel } from './isTextableChannel';
import { isGuildMessage } from './isGuildMessage';
import { notUndefined } from './notUndefined';
import { notNull } from './notNull';
import { hasValue } from './hasValue';

export const guard = {
    isGuildChannel,
    isGuildMessage,
    isTextableChannel,
    notUndefined,
    notNull,
    hasValue
};

