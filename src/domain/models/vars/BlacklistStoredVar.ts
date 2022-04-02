import { BaseStoredVar } from './BaseStoredVar';

export interface BlacklistStoredVar extends BaseStoredVar<'blacklist'> {
    readonly users: readonly string[];
    readonly guilds: readonly string[];
}
