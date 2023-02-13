import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordRoleCacheMessageBroker extends discordMessageBrokerMixin(MessageBroker, 'GUILD_CREATE', 'GUILD_UPDATE', 'GUILD_DELETE', 'GUILD_ROLE_CREATE', 'GUILD_ROLE_DELETE', 'GUILD_ROLE_UPDATE') {
    public constructor(options: DiscordRoleCacheMessageBrokerOptions) {
        super('discord-gateway-events', 'discord-role-cache', options);
    }
}

export interface DiscordRoleCacheMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
