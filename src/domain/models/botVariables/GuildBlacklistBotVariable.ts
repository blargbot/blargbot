import { BaseBotVariable } from './BaseBotVariable';

export interface GuildBlacklistBotVariable extends BaseBotVariable<`guildBlacklist`> {
    readonly values: { readonly [guildid: string]: boolean | undefined; };
}
