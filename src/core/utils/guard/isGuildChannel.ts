import { AnyChannel, GuildChannels } from 'discord.js';

export function isGuildChannel<T extends AnyChannel>(channel: T): channel is GuildChannels & T {
    switch (channel.type) {
        case 'DM': return false;
        case 'GROUP_DM': return false;
        case 'GUILD_CATEGORY': return true;
        case 'GUILD_NEWS': return true;
        case 'GUILD_NEWS_THREAD': return true;
        case 'GUILD_PRIVATE_THREAD': return true;
        case 'GUILD_PUBLIC_THREAD': return true;
        case 'GUILD_STAGE_VOICE': return true;
        case 'GUILD_STORE': return true;
        case 'GUILD_TEXT': return true;
        case 'GUILD_VOICE': return true;
        case 'UNKNOWN': return false;
    }
}
