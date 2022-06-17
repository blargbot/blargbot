import { humanize as coreHumanize } from '@blargbot/core/utils/humanize';

import * as commandParameter from './commandParameter';

export const humanize = {
    ...coreHumanize,
    ...commandParameter
};
