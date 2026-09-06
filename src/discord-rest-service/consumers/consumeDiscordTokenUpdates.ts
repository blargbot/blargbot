import type { ConfigExchange } from '@blargbot/contracts';
import type { Logger } from '@blargbot/logger';
import type { RestManager } from '@discordeno/rest';

export interface DiscordTokenUpdatesOptions {
    readonly exchange: ConfigExchange;
    readonly discord: RestManager;
    readonly logger: Logger;
}

export async function consumeDiscordTokenUpdates(options: DiscordTokenUpdatesOptions): Promise<void> {
    const { exchange, discord, logger } = options;
    await exchange.handle('set-discord-token', token => {
        discord.token = token;
        logger.warn('Discord token has been updated.');
    });
}
