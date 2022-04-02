import { BaseStoredVar } from './BaseStoredVar';

export interface GuildBlacklistStoredVar extends BaseStoredVar<'guildBlacklist'> {
    readonly values: { readonly [guildid: string]: boolean | undefined; };
}
