import { GuildCommandTag } from '@blargbot/core/types';
import { guard } from '@blargbot/core/utils';

export function isGuildImportedCommandTag<T extends GuildCommandTag>(command: T | undefined): command is Extract<T, { alias: string; }> {
    return command !== undefined
        && 'alias' in command
        && guard.hasValue(command.alias)
        && command.alias.length > 0;
}
