import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordMessageCacheMessageBroker extends discordMessageBrokerMixin({
    type: MessageBroker,
    eventExchange: 'discord-gateway-events',
    serviceName: 'discord-message-cache',
    events: [
        'GUILD_CREATE',
        'CHANNEL_CREATE',
        'MESSAGE_CREATE'
    ]
}) {
}
