import type { DiscordPermissions } from '../enums.js';

export interface GetUserPermissionsThunk {
    (guildId: string, userId: string, channelId?: string): Promise<DiscordPermissions>;
}
