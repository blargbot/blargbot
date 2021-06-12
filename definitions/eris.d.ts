import "eris";

declare module 'eris' {
    export type UserChannelInteraction<TChannel extends Channel = Channel> = { channel: Textable & TChannel, author: User }
    export type ChannelInteraction<TChannel extends Channel = Channel> = { channel: Textable & TChannel }
    export type ChannelMessage<TChannel extends Channel = Channel> = Message<Textable & TChannel>
    export type GuildMessage<TChannel extends GuildChannel = GuildChannel> = Message<Textable & TChannel>
}