import * as array from './array/index.js';
import * as bot from './bot/index.js';
import * as channel from './channel/index.js';
import * as guild from './guild/index.js';
import * as json from './json/index.js';
import * as loops from './loops/index.js';
import * as math from './math/index.js';
import * as message from './message/index.js';
import * as misc from './misc/index.js';
import * as role from './role/index.js';
import * as simple from './simple/index.js';
import * as user from './user/index.js';

export {
    array,
    bot,
    channel,
    guild,
    json,
    loops,
    math,
    message,
    misc,
    role,
    simple,
    user
};

export const all = {
    ...array,
    ...bot,
    ...channel,
    ...guild,
    ...json,
    ...loops,
    ...math,
    ...message,
    ...misc,
    ...role,
    ...simple,
    ...user
};

export default all;
