import type { ChannelSettings } from './ChannelSettings.js';
import type { CommandPermissions } from './CommandPermissions.js';
import type { GuildAnnounceOptions } from './GuildAnnounceOptions.js';
import type { GuildAutoresponses } from './GuildAutoresponses.js';
import type { GuildCensors } from './GuildCensors.js';
import type { GuildCommandTag } from './GuildCommandTag.js';
import type { GuildModlogEntry } from './GuildModlogEntry.js';
import type { GuildRolemes } from './GuildRolemes.js';
import type { GuildTriggerTag } from './GuildTriggerTag.js';
import type { GuildVotebans } from './GuildVotebans.js';
import type { GuildWarnings } from './GuildWarnings.js';
import type { StoredGuildEventLogType } from './StoredGuildEventLogType.js';
import type { StoredGuildSettings } from './StoredGuildSettings.js';

export interface StoredGuild {
    readonly guildid: string;
    readonly active: boolean;
    readonly name: string;
    readonly settings: StoredGuildSettings;
    readonly channels: { readonly [channelId: string]: ChannelSettings | undefined; };
    readonly ccommands: { readonly [key: string]: GuildCommandTag | undefined; };
    readonly commandperms?: { readonly [key: string]: CommandPermissions | undefined; };
    readonly censor?: GuildCensors;
    readonly warnings?: GuildWarnings;
    readonly modlog?: readonly GuildModlogEntry[];
    readonly nextModlogId?: number;
    readonly roleme?: GuildRolemes;
    readonly autoresponse?: GuildAutoresponses;
    readonly announce?: GuildAnnounceOptions;
    readonly log?: { readonly [P in StoredGuildEventLogType]?: string; };
    readonly logIgnore?: readonly string[];
    readonly votebans?: GuildVotebans;
    readonly interval?: GuildTriggerTag;
    readonly greeting?: GuildTriggerTag;
    readonly farewell?: GuildTriggerTag;
}
