import type { DiscordChannelTag } from './DiscordChannelTag.js';
import type { DiscordRoleTag } from './DiscordRoleTag.js';
import type { DiscordUserTag } from './DiscordUserTag.js';

export interface DiscordTagSet {
    readonly parsedUsers: Record<string, DiscordUserTag>;
    readonly parsedChannels: Record<string, DiscordChannelTag>;
    readonly parsedRoles: Record<string, DiscordRoleTag>;
}
