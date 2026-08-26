import type { AutoresponseBotVariable } from './AutoresponseBotVariable.js';
import type { BlacklistBotVariable } from './BlacklistBotVariable.js';
import type { CleverbotStateBotVariable } from './CleverbotStatsBotVariable.js';
import type { GuildBlacklistBotVariable } from './GuildBlacklistBotVariable.js';
import type { PGDonationBotVariable } from './PGDontationBotVariable.js';
import type { PoliceBotVariable } from './PoliceBotVariable.js';
import type { RestartBotVariable } from './RestartBotVariable.js';
import type { SupportBotVariable } from './SupportBotVariable.js';
import type { VersionBotVariable } from './VersionBotVariable.js';
import type { WhitelistedDomainsBotVariable } from './WhitelistedDomainsBotVariable.js';

export type BotVariable =
    | RestartBotVariable
    | AutoresponseBotVariable
    | GuildBlacklistBotVariable
    | BlacklistBotVariable
    | WhitelistedDomainsBotVariable
    | PGDonationBotVariable
    | PoliceBotVariable
    | SupportBotVariable
    | VersionBotVariable
    | CleverbotStateBotVariable;
