import { AutoresponseBotVariable } from './AutoresponseBotVariable';
import { BlacklistBotVariable } from './BlacklistBotVariable';
import { CleverbotStateBotVariable } from './CleverbotStatsBotVariable';
import { GuildBlacklistBotVariable } from './GuildBlacklistBotVariable';
import { PGDonationBotVariable } from './PGDontationBotVariable';
import { PoliceBotVariable } from './PoliceBotVariable';
import { RestartBotVariable } from './RestartBotVariable';
import { SupportBotVariable } from './SupportBotVariable';
import { VersionBotVariable } from './VersionBotVariable';
import { WhitelistedDomainsBotVariable } from './WhitelistedDomainsBotVariable';

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
