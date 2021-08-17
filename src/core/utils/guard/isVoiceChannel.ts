import { AnyChannel, VoiceChannels } from 'discord.js';

export function isVoiceChannel<T extends AnyChannel>(channel: T): channel is VoiceChannels & T {
    switch (channel.type) {
        case 'DM': return false;
        case 'GROUP_DM': return false;
        case 'GUILD_CATEGORY': return false;
        case 'GUILD_NEWS': return false;
        case 'GUILD_NEWS_THREAD': return false;
        case 'GUILD_PRIVATE_THREAD': return false;
        case 'GUILD_PUBLIC_THREAD': return false;
        case 'GUILD_STAGE_VOICE': return true;
        case 'GUILD_STORE': return false;
        case 'GUILD_TEXT': return false;
        case 'GUILD_VOICE': return true;
        case 'UNKNOWN': return false;
    }
}
