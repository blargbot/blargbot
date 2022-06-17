import * as array from './array';
import * as bot from './bot';
import * as channel from './channel';
import * as guild from './guild';
import * as json from './json';
import * as loops from './loops';
import * as math from './math';
import * as message from './message';
import * as misc from './misc';
import * as role from './role';
import * as simple from './simple';
import * as user from './user';

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
