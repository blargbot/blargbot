import { ChannelSettings } from './ChannelSettings';
import { CommandPermissions } from './CommandPermissions';
import { GuildAnnounceOptions } from './GuildAnnounceOptions';
import { GuildAutoresponses } from './GuildAutoresponses';
import { GuildCensors } from './GuildCensors';
import { GuildCommandTag } from './GuildCommandTag';
import { GuildModlogEntry } from './GuildModlogEntry';
import { GuildRolemes } from './GuildRolemes';
import { GuildTriggerTag } from './GuildTriggerTag';
import { GuildVotebans } from './GuildVotebans';
import { GuildWarnings } from './GuildWarnings';
import { StoredGuildEventLogType } from './StoredGuildEventLogType';
import { StoredGuildSettings } from './StoredGuildSettings';

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
