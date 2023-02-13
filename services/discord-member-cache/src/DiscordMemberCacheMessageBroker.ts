import { discordMessageBrokerMixin } from '@blargbot/discord-message-broker';
import MessageBroker from '@blargbot/message-broker';

export class DiscordMemberCacheMessageBroker extends discordMessageBrokerMixin(MessageBroker, 'GUILD_CREATE', 'GUILD_UPDATE', 'GUILD_DELETE', 'GUILD_MEMBER_ADD', 'GUILD_MEMBER_REMOVE', 'GUILD_MEMBER_UPDATE', 'GUILD_MEMBERS_CHUNK') {
    public constructor(options: DiscordMemberCacheMessageBrokerOptions) {
        super('discord-gateway-events', 'discord-member-cache', options);
    }
}

export interface DiscordMemberCacheMessageBrokerOptions {
    readonly hostname: string;
    readonly username: string;
    readonly password: string;
}
