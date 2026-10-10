import * as decancer from './decancer.js';
import * as embed from './embed.js';
import * as permissions from './permissions.js';
import * as smartSplit from './smartSplit.js';

export const humanize = {
    ...embed,
    ...smartSplit,
    ...permissions,
    ...decancer
};
