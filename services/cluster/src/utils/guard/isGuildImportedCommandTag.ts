import type { GuildCommandTag } from '@blargbot/domain/models/index.js';
import { hasValue } from '@blargbot/guards';

export function isGuildImportedCommandTag<T extends GuildCommandTag>(command: T | undefined): command is Extract<T, { alias: string; }> {
    return command !== undefined
        && 'alias' in command
        && hasValue(command.alias)
        && command.alias.length > 0;
}
