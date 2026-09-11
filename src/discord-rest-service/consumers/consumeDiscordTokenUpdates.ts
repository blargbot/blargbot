import type { ConfigChannel } from '@blargbot/contracts';
import type { Logger } from '@blargbot/logger';
import type { RestManager } from '@discordeno/rest';

export interface DiscordTokenUpdatesOptions {
    readonly channel: ConfigChannel;
    readonly discord: RestManager;
    readonly logger: Logger;
}

export async function consumeDiscordTokenUpdates(options: DiscordTokenUpdatesOptions): Promise<AsyncDisposable> {
    const { channel, discord, logger } = options;
    return await channel.handleSetDiscordToken(token => {
        discord.token = token;
        logger.warn('Discord token has been updated.');
    });
}
