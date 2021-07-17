import { guard, StoredGuildCommand } from '@core';

export function isAliasedCustomCommand<T extends StoredGuildCommand>(command: T | undefined): command is Extract<T, { alias: string; }> {
    return command !== undefined
        && 'alias' in command
        && guard.hasValue(command.alias)
        && command.alias.length > 0;
}
