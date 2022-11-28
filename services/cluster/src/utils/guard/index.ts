import { guard as coreGuard } from '@blargbot/core/utils/guard';

import * as isGuildCommandContext from './isGuildCommandContext';
import * as isGuildImportedCommandTag from './isGuildImportedCommandTag';
import * as isPrivateCommandContext from './isPrivateCommandContext';

export const guard = {
    ...coreGuard,
    ...isGuildImportedCommandTag,
    ...isGuildCommandContext,
    ...isPrivateCommandContext
};
