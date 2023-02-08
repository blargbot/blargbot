import * as isGuildMessage from './isGuildMessage.js';
import * as isGuildRelated from './isGuildRelated.js';
import * as isPrivateMessage from './isPrivateMessage.js';
import * as isUncached from './isUncached.js';
import * as isWellKnownChannel from './isWellKnownChannel.js';
import * as isWellKnownMessage from './isWellKnownMessage.js';
import * as testMessageFilter from './matchMessageFilter.js';

export const guard = {
    ...isGuildMessage,
    ...isGuildRelated,
    ...isWellKnownChannel,
    ...isWellKnownMessage,
    ...isPrivateMessage,
    ...testMessageFilter,
    ...isUncached
};
