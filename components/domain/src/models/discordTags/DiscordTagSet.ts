import { DiscordChannelTag } from './DiscordChannelTag';
import { DiscordRoleTag } from './DiscordRoleTag';
import { DiscordUserTag } from './DiscordUserTag';

export interface DiscordTagSet {
    readonly parsedUsers: Record<string, DiscordUserTag>;
    readonly parsedChannels: Record<string, DiscordChannelTag>;
    readonly parsedRoles: Record<string, DiscordRoleTag>;
}
