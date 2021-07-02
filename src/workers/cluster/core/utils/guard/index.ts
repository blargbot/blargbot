import { guard as globalGuard } from '../../globalCore';
import { isGuildCommandContext } from './isGuildCommandContext';
import { isPrivateCommandContext } from './isPrivateCommandContext';
import { isAliasedCustomCommand } from './isAliasedCustomCommand';
import { isGuildSetting } from './isGuildSetting';

export const guard = {
    ...globalGuard,
    isGuildCommandContext,
    isPrivateCommandContext,
    isAliasedCustomCommand,
    isGuildSetting
};