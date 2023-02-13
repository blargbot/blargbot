import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordPresenceCacheMessageBroker extends discordMessageBrokerMixin(MessageBroker, 'GUILD_CREATE', 'GUILD_DELETE', 'GUILD_MEMBER_REMOVE', 'GUILD_MEMBERS_CHUNK', 'PRESENCE_UPDATE') {
    public constructor(options: DiscordPresenceCacheMessageBrokerOptions) {
        super('discord-gateway-events', 'discord-presence-cache', options);
    }
}

export interface DiscordPresenceCacheMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
