import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordGuildCacheMessageBroker extends discordMessageBrokerMixin({
    type: MessageBroker,
    eventExchange: 'discord-gateway-events',
    serviceName: 'discord-guild-cache',
    events: [
        'GUILD_CREATE',
        'GUILD_UPDATE',
        'GUILD_DELETE'
    ]
}) {
}
