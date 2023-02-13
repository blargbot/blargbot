import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordChatlogMessageBroker extends discordMessageBrokerMixin(MessageBroker, 'MESSAGE_CREATE', 'MESSAGE_UPDATE', 'MESSAGE_DELETE', 'MESSAGE_DELETE_BULK') {
    public constructor(options: DiscordChatlogMessageBrokerOptions) {
        super('discord-gateway-events', 'discord-chatlog', options);
    }
}

export interface DiscordChatlogMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
