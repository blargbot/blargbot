import type { AmqpChannel } from '@blargbot/contracts';
import { getConfigChannel, getDiscordRestChannel } from '@blargbot/contracts';
import type { Logger } from '@blargbot/logger';
import type { RestManager } from '@discordeno/rest';

import { consumeDiscordTokenUpdates } from './consumers/consumeDiscordTokenUpdates.js';
import { consumeRestProxyMessages } from './consumers/consumeRestProxyMessages.js';

export async function setupAmqp(channel: AmqpChannel, discord: RestManager, logger: Logger): Promise<void> {
    const discordChannel = await getDiscordRestChannel(channel);
    const configChannel = await getConfigChannel(channel);

    await consumeRestProxyMessages({ channel: discordChannel, discord });
    await consumeDiscordTokenUpdates({ channel: configChannel, discord, logger });
}
