import { isGuildChannel } from './isGuildChannel';
import { isTextableChannel } from './isTextableChannel';
import { isGuildCommandContext } from './isGuildCommandContext';
import { isGuildRelated } from './isGuildRelated';
import { isGuildMessage } from './isGuildMessage';
import { notUndefined } from './notUndefined';
import { notNull } from './notNull';
import { hasValue } from './hasValue';
import { isGuildSetting } from './isGuildSetting';
import { checkEmbedSize } from './checkEmbedSize';

export const guard = {
    isGuildChannel,
    isGuildMessage,
    isTextableChannel,
    isGuildCommandContext,
    isGuildRelated,
    notUndefined,
    notNull,
    hasValue,
    isGuildSetting,
    checkEmbedSize
};

