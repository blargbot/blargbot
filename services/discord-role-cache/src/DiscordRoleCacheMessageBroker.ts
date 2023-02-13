import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordRoleCacheMessageBroker extends discordMessageBrokerMixin({
    type: MessageBroker,
    eventExchange: 'discord-gateway-events',
    serviceName: 'discord-role-cache',
    events: [
        'GUILD_CREATE',
        'GUILD_UPDATE',
        'GUILD_DELETE',
        'GUILD_ROLE_CREATE',
        'GUILD_ROLE_DELETE',
        'GUILD_ROLE_UPDATE'
    ]
}) {
}
