import * as channelName from './channelName';
import * as decancer from './decancer';
import * as duration from './duration';
import * as embed from './embed';
import * as fullName from './fullName';
import * as permissions from './permissions';
import * as ram from './ram';
import * as smartJoin from './smartJoin';
import * as smartSplit from './smartSplit';
import * as truncate from './truncate';

export const humanize = {
    ...channelName,
    ...duration,
    ...embed,
    ...fullName,
    ...smartJoin,
    ...smartSplit,
    ...truncate,
    ...ram,
    ...permissions,
    ...decancer
};
