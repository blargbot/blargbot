import * as checkEmbedSize from './checkEmbedSize.js';
import * as checkMessageSize from './checkMessageSize.js';
import * as hasInvite from './hasInvite.js';
import * as hasProperty from './hasProperty.js';
import * as hasValue from './hasValue.js';
import * as instanceOf from './instanceOf.js';
import * as isCategoryChannel from './isCategoryChannel.js';
import * as isClass from './isClass.js';
import * as isLetter from './isFlagChar.js';
import * as isGuildChannel from './isGuildChannel.js';
import * as isGuildMessage from './isGuildMessage.js';
import * as isGuildRelated from './isGuildRelated.js';
import * as isPrivateChannel from './isPrivateChannel.js';
import * as isPrivateMessage from './isPrivateMessage.js';
import * as isTextableChannel from './isTextableChannel.js';
import * as isThreadableChannel from './isThreadableChannel.js';
import * as isThreadChannel from './isThreadChannel.js';
import * as isUncached from './isUncached.js';
import * as isUrl from './isUrl.js';
import * as isVoiceChannel from './isVoiceChannel.js';
import * as isWellKnownChannel from './isWellKnownChannel.js';
import * as isWellKnownMessage from './isWellKnownMessage.js';
import * as testMessageFilter from './matchMessageFilter.js';
import * as notNull from './notNull.js';
import * as notUndefined from './notUndefined.js';

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
