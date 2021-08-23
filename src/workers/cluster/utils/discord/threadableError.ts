import { GuildChannels } from 'discord.js';

export function notThreadable(channel: GuildChannels): string {
    switch (channel.type) {
        case 'GUILD_VOICE':
            return 'Channel cannot be a voice channel';
        case 'GUILD_STAGE_VOICE':
            return 'Channel cannot be a stage channel';
        case 'GUILD_CATEGORY':
            return 'Channel cannot be a category';
        case 'GUILD_STORE':
            return 'Channel cannot be a store channel';
        case 'GUILD_PRIVATE_THREAD':
        case 'GUILD_PUBLIC_THREAD':
        case 'GUILD_NEWS_THREAD':
            return 'Channel cannot be a thread channel';
        default:
            return 'UNKNOWN';
    }
}
