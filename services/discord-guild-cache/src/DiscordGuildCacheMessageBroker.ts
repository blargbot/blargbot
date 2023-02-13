import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordGuildCacheMessageBroker extends discordMessageBrokerMixin(MessageBroker, 'GUILD_CREATE', 'GUILD_UPDATE', 'GUILD_DELETE') {
    public constructor(options: DiscordGuildCacheMessageBrokerOptions) {
        super('discord-gateway-events', 'discord-guild-cache', options);
    }
}

export interface DiscordGuildCacheMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
