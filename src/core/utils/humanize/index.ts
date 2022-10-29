import * as decancer from './decancer';
import * as embed from './embed';
import * as permissions from './permissions';
import * as smartSplit from './smartSplit';

export const humanize = {
    ...embed,
    ...smartSplit,
    ...permissions,
    ...decancer
};
