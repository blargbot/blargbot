import { ChannelSettings } from './ChannelSettings.js';
import { CommandPermissions } from './CommandPermissions.js';
import { GuildAnnounceOptions } from './GuildAnnounceOptions.js';
import { GuildAutoresponses } from './GuildAutoresponses.js';
import { GuildCensors } from './GuildCensors.js';
import { GuildCommandTag } from './GuildCommandTag.js';
import { GuildModlogEntry } from './GuildModlogEntry.js';
import { GuildRolemes } from './GuildRolemes.js';
import { GuildTriggerTag } from './GuildTriggerTag.js';
import { GuildVotebans } from './GuildVotebans.js';
import { GuildWarnings } from './GuildWarnings.js';
import { StoredGuildEventLogType } from './StoredGuildEventLogType.js';
import { StoredGuildSettings } from './StoredGuildSettings.js';

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
