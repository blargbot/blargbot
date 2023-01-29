import * as isCategoryChannel from './isCategoryChannel.js';
import * as isGuildChannel from './isGuildChannel.js';
import * as isGuildMessage from './isGuildMessage.js';
import * as isGuildRelated from './isGuildRelated.js';
import * as isPrivateChannel from './isPrivateChannel.js';
import * as isPrivateMessage from './isPrivateMessage.js';
import * as isTextableChannel from './isTextableChannel.js';
import * as isThreadableChannel from './isThreadableChannel.js';
import * as isThreadChannel from './isThreadChannel.js';
import * as isUncached from './isUncached.js';
import * as isVoiceChannel from './isVoiceChannel.js';
import * as isWellKnownChannel from './isWellKnownChannel.js';
import * as isWellKnownMessage from './isWellKnownMessage.js';
import * as testMessageFilter from './matchMessageFilter.js';

export const guard = {
    ...isCategoryChannel,
    ...isGuildChannel,
    ...isGuildMessage,
    ...isGuildRelated,
    ...isWellKnownChannel,
    ...isWellKnownMessage,
    ...isPrivateChannel,
    ...isThreadChannel,
    ...isPrivateMessage,
    ...isTextableChannel,
    ...isVoiceChannel,
    ...testMessageFilter,
    ...isUncached,
    ...isThreadableChannel
};
