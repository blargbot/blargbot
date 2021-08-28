import { AnyChannel, NewsChannel, TextChannel } from 'discord.js';

export function isThreadableChannel<T extends AnyChannel>(channel: T): channel is (TextChannel | NewsChannel) & T {
    switch (channel.type) {
        case 'DM': return false;
        case 'GROUP_DM': return false;
        case 'GUILD_CATEGORY': return false;
        case 'GUILD_NEWS': return true;
        case 'GUILD_NEWS_THREAD': return false;
        case 'GUILD_PRIVATE_THREAD': return false;
        case 'GUILD_PUBLIC_THREAD': return false;
        case 'GUILD_STAGE_VOICE': return false;
        case 'GUILD_STORE': return false;
        case 'GUILD_TEXT': return true;
        case 'GUILD_VOICE': return false;
        case 'UNKNOWN': return false;
    }
}
