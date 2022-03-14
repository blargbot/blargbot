import { humanize as coreHumanize } from '@core/utils/humanize';

import * as commandParameter from './commandParameter';
import * as flags from './flags';

export const humanize = {
    ...coreHumanize,
    ...commandParameter,
    ...flags
};
