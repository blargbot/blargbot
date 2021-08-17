import { AnyChannel, ThreadChannels } from 'discord.js';

export function isThreadChannel<T extends AnyChannel>(channel: T): channel is ThreadChannels & T {
    switch (channel.type) {
        case 'DM': return false;
        case 'GROUP_DM': return false;
        case 'GUILD_CATEGORY': return false;
        case 'GUILD_NEWS': return false;
        case 'GUILD_NEWS_THREAD': return true;
        case 'GUILD_PRIVATE_THREAD': return true;
        case 'GUILD_PUBLIC_THREAD': return true;
        case 'GUILD_STAGE_VOICE': return false;
        case 'GUILD_STORE': return false;
        case 'GUILD_TEXT': return false;
        case 'GUILD_VOICE': return false;
        case 'UNKNOWN': return false;
    }
}
