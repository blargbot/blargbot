import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordPresenceCacheMessageBroker extends discordMessageBrokerMixin({
    type: MessageBroker,
    eventExchange: 'discord-gateway-events',
    serviceName: 'discord-presence-cache',
    events: [
        'GUILD_CREATE',
        'GUILD_DELETE',
        'GUILD_MEMBER_REMOVE',
        'GUILD_MEMBERS_CHUNK',
        'PRESENCE_UPDATE'
    ]
}) {
}
