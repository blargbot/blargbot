import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordUserCacheMessageBroker extends discordMessageBrokerMixin({
    type: MessageBroker,
    eventExchange: 'discord-gateway-events',
    serviceName: 'discord-user-cache',
    events: [
        'GUILD_CREATE',
        'GUILD_UPDATE',
        'GUILD_MEMBER_ADD',
        'USER_UPDATE',
        'READY',
        'GUILD_MEMBERS_CHUNK',
        'GUILD_BAN_ADD',
        'GUILD_BAN_REMOVE',
        'INTERACTION_CREATE',
        'PRESENCE_UPDATE'
    ]
}) {
}
