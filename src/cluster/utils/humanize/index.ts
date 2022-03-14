import { humanize as coreHumanize } from '@blargbot/core/utils/humanize';

import * as commandParameter from './commandParameter';
import * as flags from './flags';

export const humanize = {
    ...coreHumanize,
    ...commandParameter,
    ...flags
};
