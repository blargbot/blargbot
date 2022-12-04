import type { BaseBotVariable } from './BaseBotVariable.js';

export interface GuildBlacklistBotVariable extends BaseBotVariable<'guildBlacklist'> {
    readonly values: { readonly [guildid: string]: boolean | undefined; };
}
