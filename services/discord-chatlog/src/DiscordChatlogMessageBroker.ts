import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordChatlogMessageBroker extends discordMessageBrokerMixin({
    type: MessageBroker,
    eventExchange: 'discord-gateway-events',
    serviceName: 'discord-chatlog',
    events: [
        'MESSAGE_CREATE',
        'MESSAGE_UPDATE',
        'MESSAGE_DELETE',
        'MESSAGE_DELETE_BULK'
    ]
}) {
}
