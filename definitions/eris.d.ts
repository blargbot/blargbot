import "eris";

declare module 'eris' {
    export type UserChannelInteraction<TChannel extends Channel = Channel> = { channel: Textable & TChannel, author: User }
    export type ChannelInteraction<TChannel extends Channel = Channel> = { channel: Textable & TChannel }
    export type AnyMessage = Message<Textable & Channel>
    export type GuildMessage = Message<Textable & GuildChannel>
    export type PrivateMessage = Message<Textable & PrivateChannel>
}