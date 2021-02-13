import { isGuildChannel } from './isGuildChannel';
import { isGuildTextableChannel } from './isGuildTextableChannel';
import { isGuildMessage } from './isGuildMessage';
import { notUndefined } from './notUndefined';
import { notNull } from './notNull';
import { hasValue } from './hasValue';

export const guard = {
    isGuildChannel,
    isGuildMessage,
    isGuildTextableChannel,
    notUndefined,
    notNull,
    hasValue
};

