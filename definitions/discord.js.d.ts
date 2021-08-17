import 'discord.js';

declare module 'discord.js' {
    export type UserChannelInteraction<TChannel extends TextBasedChannels = TextBasedChannels> = { channel: TChannel; author: User; }
    export type ChannelInteraction<TChannel extends TextBasedChannels = TextBasedChannels> = { channel: TChannel; author: never; }

    export type KnownChannel =
        | DMChannel
        | PartialDMChannel
        | PartialGroupDMChannel
        | TextChannel
        | VoiceChannel
        | CategoryChannel
        | NewsChannel
        | StoreChannel
        | ThreadChannel
        | StageChannel;

    export type AnyChannel = KnownChannel | Channel;

    type PickChannel<T extends AnyChannel['type']> = Extract<KnownChannel, { type: T; }>;

    export type PrivateChannels = PickChannel<'DM' | 'GROUP_DM'>;
    export type CategoryChannels = PickChannel<'GUILD_CATEGORY'>;
    export type GuildChannels = PickChannel<'GUILD_CATEGORY' | 'GUILD_NEWS' | 'GUILD_NEWS_THREAD' | 'GUILD_PRIVATE_THREAD' | 'GUILD_PUBLIC_THREAD' | 'GUILD_STAGE_VOICE' | 'GUILD_STORE' | 'GUILD_TEXT' | 'GUILD_VOICE'>
    export type ThreadChannels = PickChannel<'GUILD_NEWS_THREAD' | 'GUILD_PRIVATE_THREAD' | 'GUILD_PUBLIC_THREAD'>
    export type VoiceChannels = PickChannel<'GUILD_VOICE' | 'GUILD_STAGE_VOICE'>;
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
