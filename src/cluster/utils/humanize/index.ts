import { humanize as coreHumanize } from '@blargbot/core';

import * as commandParameter from './commandParameter.js';

export const humanize = {
    ...coreHumanize,
    ...commandParameter
};
