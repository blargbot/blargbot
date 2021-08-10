import 'discord.js';

import { ChannelTypes as ChannelTypesEnum } from 'discord.js/typings/enums';

declare module 'discord.js' {
    export type UserChannelInteraction<TChannel extends TextBasedChannels = TextBasedChannels> = { channel: TChannel; author: User; }
    export type ChannelInteraction<TChannel extends TextBasedChannels = TextBasedChannels> = { channel: TChannel; author: never; }

    export type AllChannels =
        | DMChannel
        | PartialDMChannel
        | PartialGroupDMChannel
        | TextChannel
        | VoiceChannel
        | CategoryChannel
        | NewsChannel
        | StoreChannel
        | ThreadChannel
        | StageChannel
        | Channel;

    type PickChannels<T extends Channel['type']> = Extract<AllChannels, { type: T; }>;

    export type PrivateChannels = PickChannels<'DM' | 'GROUP_DM'>;
    export type CategoryChannels = PickChannels<'GUILD_CATEGORY'>;
    export type GuildChannels = PickChannels<'GUILD_CATEGORY' | 'GUILD_NEWS' | 'GUILD_NEWS_THREAD' | 'GUILD_PRIVATE_THREAD' | 'GUILD_PUBLIC_THREAD' | 'GUILD_STAGE_VOICE' | 'GUILD_STORE' | 'GUILD_TEXT' | 'GUILD_VOICE'>
    export type ThreadChannels = PickChannels<'GUILD_NEWS_THREAD' | 'GUILD_PRIVATE_THREAD' | 'GUILD_PUBLIC_THREAD'>
    export type VoiceChannels = PickChannels<'GUILD_VOICE' | 'GUILD_STAGE_VOICE'>;
    export type GuildTextBasedChannels = GuildChannels & TextBasedChannels;
    export type PrivateTextBasedChannels = PrivateChannels & TextBasedChannels;

    export type GuildMessage<T extends Message = Message> = T & {
        channel: T['channel'] & GuildTextBasedChannels;
        member: GuildMember;
    }

    export type GuildPartialMessage<T extends PartialMessage = PartialMessage> = T & {
        channel: T['channel'] & GuildTextBasedChannels;
        member: GuildMember;
    }

    interface PartialGroupDMChannel {
        type: 'GROUP_DM';
    }

    interface Caches {
        ChannelManager: [manager: typeof ChannelManager, holds: typeof Channel];
        GuildChannelManager: [manager: typeof GuildChannelManager, holds: typeof GuildChannel];
    }
}
