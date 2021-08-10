import { AllChannels, CategoryChannels } from 'discord.js';

export function isCategoryChannel<T extends AllChannels>(channel: T): channel is CategoryChannels & T {
    switch (channel.type) {
        case 'DM': return false;
        case 'GROUP_DM': return false;
        case 'GUILD_CATEGORY': return true;
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
