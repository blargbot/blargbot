import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordChannelCacheMessageBroker extends discordMessageBrokerMixin({
    type: MessageBroker,
    eventExchange: 'discord-gateway-events',
    serviceName: 'discord-channel-cache',
    events: [
        'GUILD_CREATE',
        'GUILD_DELETE',
        'CHANNEL_CREATE',
        'CHANNEL_UPDATE',
        'CHANNEL_DELETE',
        'THREAD_CREATE',
        'THREAD_UPDATE',
        'THREAD_DELETE',
        'THREAD_LIST_SYNC'
    ]
}) {
}
