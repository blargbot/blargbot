import { AnyChannel, PrivateChannels } from 'discord.js';

export function isPrivateChannel<T extends AnyChannel>(channel: T): channel is PrivateChannels & T {
    switch (channel.type) {
        case 'DM': return true;
        case 'GROUP_DM': return true;
        case 'GUILD_CATEGORY': return false;
        case 'GUILD_NEWS': return false;
        case 'GUILD_NEWS_THREAD': return false;
        case 'GUILD_PRIVATE_THREAD': return false;
        case 'GUILD_PUBLIC_THREAD': return false;
        case 'GUILD_STAGE_VOICE': return false;
        case 'GUILD_STORE': return false;
        case 'GUILD_TEXT': return false;
        case 'GUILD_VOICE': return false;
        case 'UNKNOWN': return false;
    }
}
