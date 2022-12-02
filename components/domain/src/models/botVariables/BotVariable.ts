import { AutoresponseBotVariable } from './AutoresponseBotVariable.js';
import { BlacklistBotVariable } from './BlacklistBotVariable.js';
import { CleverbotStateBotVariable } from './CleverbotStatsBotVariable.js';
import { GuildBlacklistBotVariable } from './GuildBlacklistBotVariable.js';
import { PGDonationBotVariable } from './PGDontationBotVariable.js';
import { PoliceBotVariable } from './PoliceBotVariable.js';
import { RestartBotVariable } from './RestartBotVariable.js';
import { SupportBotVariable } from './SupportBotVariable.js';
import { VersionBotVariable } from './VersionBotVariable.js';
import { WhitelistedDomainsBotVariable } from './WhitelistedDomainsBotVariable.js';

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
