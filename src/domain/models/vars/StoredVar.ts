import { ARWhitelistStoredVar } from './ARWhitelistStoredVar';
import { BlacklistStoredVar } from './BlacklistStoredVar';
import { CleverStatsStoredVar } from './CleverStatsStoredVar';
import { GuildBlacklistStoredVar } from './GuildBlacklistStoredVar';
import { PGStoredVar } from './PGStoredVar';
import { PoliceStoredVar } from './PoliceStoredVar';
import { RestartStoredVar } from './RestartStoredVar';
import { SupportStoredVar } from './SupportStoredVar';
import { TagVarsStoredVar } from './TagVarsStoredVar';
import { VersionStoredVar } from './VersionStoredVar';
import { WhitelistedDomainsStoredVar } from './WhitelistedDomainsStoredVar';

export type StoredVar = RestartStoredVar |
    TagVarsStoredVar |
    ARWhitelistStoredVar |
    GuildBlacklistStoredVar |
    BlacklistStoredVar |
    WhitelistedDomainsStoredVar |
    PGStoredVar |
    PoliceStoredVar |
    SupportStoredVar |
    VersionStoredVar |
    CleverStatsStoredVar;
