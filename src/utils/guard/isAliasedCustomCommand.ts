import { StoredGuildCommand } from '../../core/database';


export function isAliasedCustomCommand<T extends StoredGuildCommand>(command: T | undefined): command is Extract<T, { alias: string; }> {
    return command !== undefined
        && 'alias' in command
        && command.alias !== undefined
        && command.alias.length > 0;
}
