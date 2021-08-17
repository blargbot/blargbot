import { AnyChannel, TextBasedChannels } from 'discord.js';

export function isTextableChannel<T extends AnyChannel>(channel: T): channel is TextBasedChannels & T {
    switch (channel.type) {
        case 'DM': return true;
        case 'GROUP_DM': return true;
        case 'GUILD_CATEGORY': return false;
        case 'GUILD_NEWS': return true;
        case 'GUILD_NEWS_THREAD': return true;
        case 'GUILD_PRIVATE_THREAD': return true;
        case 'GUILD_PUBLIC_THREAD': return true;
        case 'GUILD_STAGE_VOICE': return false;
        case 'GUILD_STORE': return false;
        case 'GUILD_TEXT': return true;
        case 'GUILD_VOICE': return false;
        case 'UNKNOWN': return false;
    }
}
