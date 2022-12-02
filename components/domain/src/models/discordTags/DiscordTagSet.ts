import { DiscordChannelTag } from './DiscordChannelTag.js';
import { DiscordRoleTag } from './DiscordRoleTag.js';
import { DiscordUserTag } from './DiscordUserTag.js';

export interface DiscordTagSet {
    readonly parsedUsers: Record<string, DiscordUserTag>;
    readonly parsedChannels: Record<string, DiscordChannelTag>;
    readonly parsedRoles: Record<string, DiscordRoleTag>;
}
