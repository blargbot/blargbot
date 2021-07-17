import 'eris';

declare module 'eris' {
    export type UserChannelInteraction<TChannel extends Channel = Channel> = { channel: Textable & TChannel; author: User; }
    export type ChannelInteraction<TChannel extends Channel = Channel> = { channel: Textable & TChannel; author: never; }
    export type AnyMessage = Message<Textable & Channel>
    export type GuildMessage = Message<Textable & GuildChannel> & { member: Member; }
    export type PrivateMessage = Message<Textable & PrivateChannel>
    export type OldMember = { nick?: string; premiumSince: number; roles: string[]; };

    export type ClientEventTypes = EventListenerEventTypes & {
        'shardResume': [id: number];
        'shardReady': [id: number];
        'error': [err: Error, id: number];
        'shardDisconnect': [err: Error, id: number];
    };
    export type EventListenerEventTypes = {
        'disconnect': [];
        'ready': [];
        'callRing': [call: Call];
        'callDelete': [call: Call];
        'callCreate': [call: Call];
        'callUpdate': [call: Call, oldCall: OldCall];
        'channelDelete': [channel: AnyChannel];
        'channelCreate': [channel: AnyChannel];
        'channelPinUpdate': [channel: TextableChannel, timestamp: number, oldTimestamp: number];
        'channelRecipientRemove': [channel: GroupChannel, user: User];
        'channelRecipientAdd': [channel: GroupChannel, user: User];
        'channelUpdate': [channel: AnyChannel, oldChannel: OldGuildChannel | OldGroupChannel];
        'shardPreReady': [id: number];
        'connect': [id: number];
        'friendSuggestionCreate': [user: User, reasons: FriendSuggestionReasons];
        'friendSuggestionDelete': [user: User];
        'guildBanRemove': [guild: Guild, user: User];
        'guildBanAdd': [guild: Guild, user: User];
        'guildCreate': [guild: Guild];
        'guildAvailable': [guild: Guild];
        'guildDelete': [guild: PossiblyUncachedGuild];
        'guildEmojisUpdate': [guild: Guild, emojis: Emoji[], oldEmojis: Emoji[]];
        'guildMemberAdd': [guild: Guild, member: Member];
        'guildMemberChunk': [guild: Guild, members: Member[]];
        'guildMemberRemove': [guild: Guild, member: Member | MemberPartial];
        'guildMemberUpdate': [guild: Guild, member: Member, oldMember: OldMember | null];
        'guildRoleDelete': [guild: Guild, role: Role];
        'guildRoleCreate': [guild: Guild, role: Role];
        'guildRoleUpdate': [guild: Guild, role: Role, oldRole: OldRole];
        'unavailableGuildCreate': [guild: UnavailableGuild];
        'guildUnavailable': [guild: UnavailableGuild];
        'guildUpdate': [guild: Guild, oldGuild: OldGuild];
        'hello': [trace: string[], id: number];
        'inviteDelete': [guild: Guild, invite: Invite & InviteWithMetadata];
        'inviteCreate': [guild: Guild, invite: Invite & InviteWithMetadata];
        'messageCreate': [message: Message];
        'messageReactionRemoveAll': [message: PossiblyUncachedMessage];
        'messageDelete': [message: PossiblyUncachedMessage];
        'messageReactionRemoveEmoji': [message: PossiblyUncachedMessage, emoji: PartialEmoji];
        'messageDeleteBulk': [messages: PossiblyUncachedMessage[]];
        'messageReactionAdd': [message: PossiblyUncachedMessage, emoji: Emoji, reactor: Member | { id: string; }];
        'messageReactionRemove': [message: PossiblyUncachedMessage, emoji: PartialEmoji, userID: string];
        'messageUpdate': [message: Message, oldMessage: OldMessage | null];
        'presenceUpdate': [other: Member | Relationship, oldPresence: Presence | null];
        'rawREST': [request: RawRESTRequest];
        'unknown': [packet: RawPacket, id: number];
        'rawWS': [packet: RawPacket, id: number];
        'relationshipRemove': [relationship: Relationship];
        'relationshipAdd': [relationship: Relationship];
        'relationshipUpdate': [relationship: Relationship, oldRelationship: { type: number; }];
        'typingStart': [channel: TextableChannel | { id: string; }, user: User | { id: string; }];
        'userUpdate': [user: User, oldUser: PartialUser | null];
        'voiceChannelJoin': [member: Member, newChannel: VoiceChannel];
        'voiceChannelLeave': [member: Member, oldChannel: VoiceChannel];
        'voiceChannelSwitch': [member: Member, newChannel: VoiceChannel, oldChannel: VoiceChannel];
        'voiceStateUpdate': [member: Member, oldState: OldVoiceState];
        'debug': [message: string, id: number];
        'warn': [message: string, id: number];
        'webhooksUpdate': [data: WebhookData];
    }

    interface ClientEvents<T> extends EventListeners<T> {
        <E extends keyof ClientEventTypes>(event: E, handler: (...args: ClientEventTypes[E]) => void): Client;
    }

    interface Client {
        off: ClientEvents<this>;
        getChannel(channelId: string): AnyChannel | undefined;
    }

    interface Collection<T> {
        find<R>(func: (i: T) => i is T & R): Extract<T, R> | undefined;
        filter<R>(func: (i: T) => i is T & R): Array<Extract<T, R>>;
    }
}
