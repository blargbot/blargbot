import { BaseBotVariable } from './BaseBotVariable';

export interface BlacklistBotVariable extends BaseBotVariable<'blacklist'> {
    readonly users: readonly string[];
    readonly guilds: readonly string[];
}
