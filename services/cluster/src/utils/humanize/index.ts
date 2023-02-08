import { humanize as coreHumanize } from '@blargbot/core/utils/humanize/index.js';

import * as commandParameter from './commandParameter.js';

export const humanize = {
    ...coreHumanize,
    ...commandParameter
};
