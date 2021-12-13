import 'eris';

declare module 'eris' {
    export type UserChannelInteraction<TChannel extends KnownTextableChannel = KnownTextableChannel> = { channel: TChannel; author: User; }
    export type ChannelInteraction<TChannel extends KnownTextableChannel = KnownTextableChannel> = { channel: TChannel; author: never; }

    export type KnownMessage = Message<KnownTextableChannel>;
    export type PossiblyUncachedGuildMessage = Message<KnownGuildTextableChannel> | { channel: KnownGuildTextableChannel | { id: string; guild: Uncached; }; guildID: string; id: string; };

    export type KnownChannel =
        | TextChannel
        | PrivateChannel
        | VoiceChannel
        | GroupChannel
        | CategoryChannel
        | NewsChannel
        | StoreChannel
        | NewsThreadChannel
        | PublicThreadChannel
        | PrivateThreadChannel
        | StageChannel;

    type _KnownChannelMap = { [P in KnownChannel as P['type']]: P };
    export type KnownChannelMap = { [P in keyof _KnownChannelMap]: Coalesce<Extract<_KnownChannelMap[P], { type: P; }>, _KnownChannelMap[P]> };

    export type KnownGuildChannel = Extract<KnownChannel, GuildChannel>;
    export type KnownGuildTextableChannel = Extract<KnownGuildChannel, Textable>;
    export type KnownThreadChannel = Extract<KnownChannel, ThreadChannel>;
    export type KnownTextableChannel = Extract<KnownChannel, Textable>;
    export type KnownVoiceChannel = Extract<KnownChannel, VoiceChannel>;
    export type KnownThreadableChannel = Exclude<GuildTextableChannel, KnownThreadChannel>;
    export type KnownPrivateChannel = Extract<KnownChannel, PrivateChannel>;
    export type KnownCategoryChannel = Extract<KnownChannel, CategoryChannel>;

    export type KnownInteraction =
        | PingInteraction
        | CommandInteraction
        | ComponentInteraction
        | AutocompleteInteraction
        | UnknownInteraction

    type Assert<Expected, Actual extends Expected> = Actual;
    type AssertAllChannelTypes = Assert<true, KnownChannel['type'] extends Constants['ChannelTypes'][keyof Constants['ChannelTypes']]
        ? Constants['ChannelTypes'][keyof Constants['ChannelTypes']] extends KnownChannel['type']
        ? true
        : false : false>;

    export const enum OAuthTeamMemberState {
        INVITED = 1,
        ACCEPTED = 2
    }

    export interface Client {
        getChannel(channelID: string): AnyChannel | undefined;
    }

    export interface Guild {
        createChannel<T extends Exclude<KnownGuildChannel, KnownThreadChannel>['type']>(name: string, type: T, options?: CreateChannelOptions): Promise<KnownChannelMap[T]>;
    }

    export interface Collection<T> {
        filter<R extends T>(func: (i: T) => i is R): R[];
        find<R extends T>(func: (i: T) => i is R): R | undefined;
    }

    export const enum AuditLogActionType {
        GUILD_UPDATE = 1,
        CHANNEL_CREATE = 10,
        CHANNEL_UPDATE = 11,
        CHANNEL_DELETE = 12,
        CHANNEL_OVERWRITE_CREATE = 13,
        CHANNEL_OVERWRITE_UPDATE = 14,
        CHANNEL_OVERWRITE_DELETE = 15,
        MEMBER_KICK = 20,
        MEMBER_PRUNE = 21,
        MEMBER_BAN_ADD = 22,
        MEMBER_BAN_REMOVE = 23,
        MEMBER_UPDATE = 24,
        MEMBER_ROLE_UPDATE = 25,
        MEMBER_MOVE = 26,
        MEMBER_DISCONNECT = 27,
        BOT_ADD = 28,
        ROLE_CREATE = 30,
        ROLE_UPDATE = 31,
        ROLE_DELETE = 32,
        INVITE_CREATE = 40,
        INVITE_UPDATE = 41,
        INVITE_DELETE = 42,
        WEBHOOK_CREATE = 50,
        WEBHOOK_UPDATE = 51,
        WEBHOOK_DELETE = 52,
        EMOJI_CREATE = 60,
        EMOJI_UPDATE = 61,
        EMOJI_DELETE = 62,
        MESSAGE_DELETE = 72,
        MESSAGE_BULK_DELETE = 73,
        MESSAGE_PIN = 74,
        MESSAGE_UNPIN = 75,
        INTEGRATION_CREATE = 80,
        INTEGRATION_UPDATE = 81,
        INTEGRATION_DELETE = 82,
        STAGE_INSTANCE_CREATE = 83,
        STAGE_INSTANCE_UPDATE = 84,
        STAGE_INSTANCE_DELETE = 85,
        STICKER_CREATE = 90,
        STICKER_UPDATE = 91,
        STICKER_DELETE = 92,
        THREAD_CREATE = 110,
        THREAD_UPDATE = 111,
        THREAD_DELETE = 112
    }

    export const enum ApiError {
        UNKNOWN_ACCOUNT = 10001,
        UNKNOWN_APPLICATION = 10002,
        UNKNOWN_CHANNEL = 10003,
        UNKNOWN_GUILD = 10004,
        UNKNOWN_INTEGRATION = 10005,
        UNKNOWN_INVITE = 10006,
        UNKNOWN_MEMBER = 10007,
        UNKNOWN_MESSAGE = 10008,
        UNKNOWN_OVERWRITE = 10009,
        UNKNOWN_PROVIDER = 10010,
        UNKNOWN_ROLE = 10011,
        UNKNOWN_TOKEN = 10012,
        UNKNOWN_USER = 10013,
        UNKNOWN_EMOJI = 10014,
        UNKNOWN_WEBHOOK = 10015,
        UNKNOWN_WEBHOOK_SERVICE = 10016,
        UNKNOWN_SESSION = 10020,
        UNKNOWN_BAN = 10026,
        UNKNOWN_SKU = 10027,
        UNKNOWN_STORE_LISTING = 10028,
        UNKNOWN_ENTITLEMENT = 10029,
        UNKNOWN_BUILD = 10030,
        UNKNOWN_LOBBY = 10031,
        UNKNOWN_BRANCH = 10032,
        UNKNOWN_STORE_DIRECTORY_LAYOUT = 10033,
        UNKNOWN_REDISTRIBUTABLE = 10036,
        UNKNOWN_GIFT_CODE = 10038,
        UNKNOWN_STREAM = 10049,
        UNKNOWN_PREMIUM_SERVER_SUBSCRIBE_COOLDOWN = 10050,
        UNKNOWN_GUILD_TEMPLATE = 10057,
        UNKNOWN_DISCOVERABLE_SERVER_CATEGORY = 10059,
        UNKNOWN_STICKER = 10060,
        UNKNOWN_INTERACTION = 10062,
        UNKNOWN_APPLICATION_COMMAND = 10063,
        UNKNOWN_APPLICATION_COMMAND_PERMISSIONS = 10066,
        UNKNOWN_STAGE_INSTANCE = 10067,
        UNKNOWN_GUILD_MEMBER_VERIFICATION_FORM = 10068,
        UNKNOWN_GUILD_WELCOME_SCREEN = 10069,
        UNKNOWN_GUILD_SCHEDULED_EVENT = 10070,
        UNKNOWN_GUILD_SCHEDULED_EVENT_USER = 10071,
        BOT_PROHIBITED_ENDPOINT = 20001,
        BOT_ONLY_ENDPOINT = 20002,
        CANNOT_SEND_EXPLICIT_CONTENT = 20009,
        NOT_AUTHORIZED = 20012,
        SLOWMODE_RATE_LIMIT = 20016,
        ACCOUNT_OWNER_ONLY = 20018,
        ANNOUNCEMENT_EDIT_LIMIT_EXCEEDED = 20022,
        CHANNEL_HIT_WRITE_RATELIMIT = 20028,
        SERVER_HIT_WRITE_RATELIMIT = 20029,
        CONTENT_NOT_ALLOWED = 20031,
        GUILD_PREMIUM_LEVEL_TOO_LOW = 20035,
        MAXIMUM_GUILDS = 30001,
        MAXIMUM_FRIENDS = 30002,
        MAXIMUM_PINS = 30003,
        MAXIMUM_RECIPIENTS = 30004,
        MAXIMUM_ROLES = 30005,
        MAXIMUM_WEBHOOKS = 30007,
        MAXIMUM_EMOJIS = 30008,
        MAXIMUM_REACTIONS = 30010,
        MAXIMUM_CHANNELS = 30013,
        MAXIMUM_ATTACHMENTS = 30015,
        MAXIMUM_INVITES = 30016,
        MAXIMUM_ANIMATED_EMOJIS = 30018,
        MAXIMUM_SERVER_MEMBERS = 30019,
        MAXIMUM_NUMBER_OF_SERVER_CATEGORIES = 30030,
        GUILD_ALREADY_HAS_TEMPLATE = 30031,
        MAXIMUM_THREAD_PARTICIPANTS = 30033,
        MAXIMUM_NON_GUILD_MEMBERS_BANS = 30035,
        MAXIMUM_BAN_FETCHES = 30037,
        MAXIMUM_NUMBER_OF_STICKERS_REACHED = 30039,
        MAXIMUM_PRUNE_REQUESTS = 30040,
        MAXIMUM_GUILD_WIDGET_SETTINGS_UPDATE = 30042,
        UNAUTHORIZED = 40001,
        ACCOUNT_VERIFICATION_REQUIRED = 40002,
        DIRECT_MESSAGES_TOO_FAST = 40003,
        REQUEST_ENTITY_TOO_LARGE = 40005,
        FEATURE_TEMPORARILY_DISABLED = 40006,
        USER_BANNED = 40007,
        TARGET_USER_NOT_CONNECTED_TO_VOICE = 40032,
        ALREADY_CROSSPOSTED = 40033,
        MISSING_ACCESS = 50001,
        INVALID_ACCOUNT_TYPE = 50002,
        CANNOT_EXECUTE_ON_DM = 50003,
        EMBED_DISABLED = 50004,
        CANNOT_EDIT_MESSAGE_BY_OTHER = 50005,
        CANNOT_SEND_EMPTY_MESSAGE = 50006,
        CANNOT_MESSAGE_USER = 50007,
        CANNOT_SEND_MESSAGES_IN_VOICE_CHANNEL = 50008,
        CHANNEL_VERIFICATION_LEVEL_TOO_HIGH = 50009,
        OAUTH2_APPLICATION_BOT_ABSENT = 50010,
        MAXIMUM_OAUTH2_APPLICATIONS = 50011,
        INVALID_OAUTH_STATE = 50012,
        MISSING_PERMISSIONS = 50013,
        INVALID_AUTHENTICATION_TOKEN = 50014,
        NOTE_TOO_LONG = 50015,
        INVALID_BULK_DELETE_QUANTITY = 50016,
        CANNOT_PIN_MESSAGE_IN_OTHER_CHANNEL = 50019,
        INVALID_OR_TAKEN_INVITE_CODE = 50020,
        CANNOT_EXECUTE_ON_SYSTEM_MESSAGE = 50021,
        CANNOT_EXECUTE_ON_CHANNEL_TYPE = 50024,
        INVALID_OAUTH_TOKEN = 50025,
        MISSING_OAUTH_SCOPE = 50026,
        INVALID_WEBHOOK_TOKEN = 50027,
        INVALID_ROLE = 50028,
        INVALID_RECIPIENTS = 50033,
        BULK_DELETE_MESSAGE_TOO_OLD = 50034,
        INVALID_FORM_BODY = 50035,
        INVITE_ACCEPTED_TO_GUILD_NOT_CONTAINING_BOT = 50036,
        INVALID_API_VERSION = 50041,
        FILE_UPLOADED_EXCEEDS_MAXIMUM_SIZE = 50045,
        INVALID_FILE_UPLOADED = 50046,
        CANNOT_SELF_REDEEM_GIFT = 50054,
        INVALID_GUILD = 50055,
        PAYMENT_SOURCE_REQUIRED = 50070,
        CANNOT_DELETE_COMMUNITY_REQUIRED_CHANNEL = 50074,
        INVALID_STICKER_SENT = 50081,
        INVALID_OPERATION_ON_ARCHIVED_THREAD = 50083,
        INVALID_THREAD_NOTIFICATION_SETTINGS = 50084,
        PARAMETER_EARLIER_THAN_CREATION = 50085,
        GUILD_NOT_AVAILABLE_IN_LOCATION = 50095,
        GUILD_MONETIZATION_REQUIRED = 50097,
        INSUFFICIENT_BOOSTS = 50101,
        TWO_FACTOR_REQUIRED = 60003,
        NO_USERS_WITH_DISCORDTAG_EXIST = 80004,
        REACTION_BLOCKED = 90001,
        RESOURCE_OVERLOADED = 130000,
        STAGE_ALREADY_OPEN = 150006,
        CANNOT_REPLY_WITHOUT_READ_MESSAGE_HISTORY_PERMISSION = 160002,
        MESSAGE_ALREADY_HAS_THREAD = 160004,
        THREAD_LOCKED = 160005,
        MAXIMUM_ACTIVE_THREADS = 160006,
        MAXIMUM_ACTIVE_ANNOUNCEMENT_THREADS = 160007,
        INVALID_JSON_FOR_UPLOADED_LOTTIE_FILE = 170001,
        UPLOADED_LOTTIES_CANNOT_CONTAIN_RASTERIZED_IMAGES = 170002,
        STICKER_MAXIMUM_FRAMERATE_EXCEEDED = 170003,
        STICKER_FRAME_COUNT_EXCEEDS_MAXIMUM_OF_1000_FRAMES = 170004,
        LOTTIE_ANIMATION_MAXIMUM_DIMENSIONS_EXCEEDED = 170005,
        STICKER_FRAME_RATE_IS_TOO_SMALL_OR_TOO_LARGE = 170006,
        STICKER_ANIMATION_DURATION_EXCEEDS_MAXIMUM_OF_5_SECONDS = 170007,
    }
}
