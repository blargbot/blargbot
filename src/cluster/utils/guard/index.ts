import { guard as coreGuard } from '@blargbot/core';

import * as isGuildCommandContext from './isGuildCommandContext.js';
import * as isGuildImportedCommandTag from './isGuildImportedCommandTag.js';
import * as isPrivateCommandContext from './isPrivateCommandContext.js';

export const guard = {
    ...coreGuard,
    ...isGuildImportedCommandTag,
    ...isGuildCommandContext,
    ...isPrivateCommandContext
};
