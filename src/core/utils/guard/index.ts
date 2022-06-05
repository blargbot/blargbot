import * as checkEmbedSize from './checkEmbedSize';
import * as checkMessageSize from './checkMessageSize';
import * as hasInvite from './hasInvite';
import * as hasProperty from './hasProperty';
import * as hasValue from './hasValue';
import * as instanceOf from './instanceOf';
import * as isCategoryChannel from './isCategoryChannel';
import * as isClass from './isClass';
import * as isLetter from './isFlagChar';
import * as isGuildChannel from './isGuildChannel';
import * as isGuildMessage from './isGuildMessage';
import * as isGuildRelated from './isGuildRelated';
import * as isPrivateChannel from './isPrivateChannel';
import * as isPrivateMessage from './isPrivateMessage';
import * as isTextableChannel from './isTextableChannel';
import * as isThreadableChannel from './isThreadableChannel';
import * as isThreadChannel from './isThreadChannel';
import * as isUncached from './isUncached';
import * as isUrl from './isUrl';
import * as isVoiceChannel from './isVoiceChannel';
import * as isWellKnownChannel from './isWellKnownChannel';
import * as isWellKnownMessage from './isWellKnownMessage';
import * as notNull from './notNull';
import * as notUndefined from './notUndefined';
import * as testMessageFilter from './testMessageFilter';

export const guard = {
    ...checkEmbedSize,
    ...checkMessageSize,
    ...hasProperty,
    ...hasValue,
    ...isCategoryChannel,
    ...isClass,
    ...isGuildChannel,
    ...isGuildMessage,
    ...isGuildRelated,
    ...isWellKnownChannel,
    ...isWellKnownMessage,
    ...isLetter,
    ...isPrivateChannel,
    ...isThreadChannel,
    ...isPrivateMessage,
    ...isTextableChannel,
    ...isVoiceChannel,
    ...notNull,
    ...notUndefined,
    ...testMessageFilter,
    ...isUncached,
    ...isUrl,
    ...hasInvite,
    ...isThreadableChannel,
    ...instanceOf
};
