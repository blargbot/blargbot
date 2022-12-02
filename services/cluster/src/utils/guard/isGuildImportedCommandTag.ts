import { guard } from '@blargbot/core/utils/index.js';
import { GuildCommandTag } from '@blargbot/domain/models/index.js';

export function isGuildImportedCommandTag<T extends GuildCommandTag>(command: T | undefined): command is Extract<T, { alias: string; }> {
    return command !== undefined
        && 'alias' in command
        && guard.hasValue(command.alias)
        && command.alias.length > 0;
}
