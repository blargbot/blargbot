/* eslint-disable @typescript-eslint/no-empty-interface */
import type * as Discord from 'discord-api-types/v10';

export interface User extends Discord.APIUser {
    member?: Member;
}
export interface Member extends Omit<Discord.APIGuildMember, 'user'> {
    status?: Discord.PresenceUpdateStatus;
    activities: Discord.GatewayActivity[];
}
export interface Role extends Discord.APIRole { }
export interface RoleCreate {
    name: string;
    color?: number;
    permissions: bigint;
    mentionable: boolean;
    hoist: boolean;
}

type ChannelLookup = { [Channel in Discord.APIChannel as Channel['type']]: Channel };
type GuildChannelLookup = { [P in keyof ChannelLookup as 'guild_id' extends keyof ChannelLookup[P] ? P : never]: Omit<ChannelLookup[P], 'guild_id'> };
export type Channel = GuildChannelLookup[keyof GuildChannelLookup];

export interface Thread extends Discord.APIThreadChannel { }
export interface Message extends Discord.APIMessage { }
export interface Guild extends Discord.APIGuild {

}
export interface MessageCreateOptions extends Discord.RESTPostAPIChannelMessageJSONBody {
    files?: FileContent[];
}

export interface WebhookCreateOptions extends MessageCreateOptions {
    username?: string;
    avatarUrl?: string;
}

export interface FileContent {
    file: string;
    name: string;
}

export interface PermissionOverwrite extends Discord.APIOverwrite {

}

export interface CreateChannel {
    name: string;
    type: Channel['type'];
    bitrate?: number;
    nsfw?: boolean;
    parentID?: string;
    permissionOverwrites?: Discord.APIOverwrite[];
    position?: number;
    rateLimitPerUser?: number;
    topic?: string;
    userLimit?: number;
}

export interface EditChannel extends Omit<CreateChannel, 'name' | 'type' | 'permissionOverwrites'> {
    archived?: boolean;
    autoArchiveDuration?: Discord.ThreadAutoArchiveDuration;
    defaultAutoArchiveDuration?: Discord.ThreadAutoArchiveDuration;
    icon?: string;
    invitable?: boolean;
    locked?: boolean;
    name?: string;
    ownerID?: string;
    rtcRegion?: string | null;
    videoQualityMode?: Discord.VideoQualityMode;
}

export interface CreateEmote extends Discord.RESTPostAPIGuildEmojiJSONBody {

}
