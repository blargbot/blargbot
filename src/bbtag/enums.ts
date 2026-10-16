/* eslint-disable @typescript-eslint/naming-convention, no-useless-assignment */
import type { BitFlagNames } from './BitFlags.js';
import { defineBitFlags } from './BitFlags.js';

function defineEnum<const T extends object>(values: T): T {
    Object.setPrototypeOf(values, null);
    Object.freeze(values);
    return values;
}

export type ChannelTypeName = keyof typeof ChannelType;
export type ChannelType = typeof ChannelType[ChannelTypeName];
export const ChannelType = defineEnum({
    GUILD_TEXT: 0,
    DM: 1,
    GUILD_VOICE: 2,
    GROUP_DM: 3,
    GUILD_CATEGORY: 4,
    GUILD_ANNOUNCEMENT: 5,
    ANNOUNCEMENT_THREAD: 10,
    PUBLIC_THREAD: 11,
    PRIVATE_THREAD: 12,
    GUILD_STAGE_VOICE: 13,
    GUILD_DIRECTORY: 14,
    GUILD_FORUM: 15,
    GUILD_MEDIA: 16
});

export type ChannelFlagsName = BitFlagNames<ChannelFlags>;
export class ChannelFlags extends defineBitFlags({
    PINNED: 1 << 1,
    REQUIRE_TAG: 1 << 4,
    HIDE_MEDIA_DOWNLOAD_OPTIONS: 1 << 15,
    CHANNEL_OBFUSCATED: 1 << 17,
    IS_SPOILER_CHANNEL: 1 << 21
}) { }

export type DiscordPermissionName = BitFlagNames<DiscordPermissions>;
export class DiscordPermissions extends defineBitFlags({
    NONE: 0n,
    CREATE_INSTANT_INVITE: 1n << 0n,
    KICK_MEMBERS: 1n << 1n,
    BAN_MEMBERS: 1n << 2n,
    ADMINISTRATOR: 1n << 3n,
    MANAGE_CHANNELS: 1n << 4n,
    MANAGE_GUILD: 1n << 5n,
    ADD_REACTIONS: 1n << 6n,
    VIEW_AUDIT_LOG: 1n << 7n,
    PRIORITY_SPEAKER: 1n << 8n,
    STREAM: 1n << 9n,
    VIEW_CHANNEL: 1n << 10n,
    SEND_MESSAGES: 1n << 11n,
    SEND_TTS_MESSAGES: 1n << 12n,
    MANAGE_MESSAGES: 1n << 13n,
    EMBED_LINKS: 1n << 14n,
    ATTACH_FILES: 1n << 15n,
    READ_MESSAGE_HISTORY: 1n << 16n,
    MENTION_EVERYONE: 1n << 17n,
    USE_EXTERNAL_EMOJIS: 1n << 18n,
    VIEW_GUILD_INSIGHTS: 1n << 19n,
    CONNECT: 1n << 20n,
    SPEAK: 1n << 21n,
    MUTE_MEMBERS: 1n << 22n,
    DEAFEN_MEMBERS: 1n << 23n,
    MOVE_MEMBERS: 1n << 24n,
    USE_VAD: 1n << 25n,
    CHANGE_NICKNAME: 1n << 26n,
    MANAGE_NICKNAMES: 1n << 27n,
    MANAGE_ROLES: 1n << 28n,
    MANAGE_WEBHOOKS: 1n << 29n,
    MANAGE_GUILD_EXPRESSIONS: 1n << 30n,
    USE_APPLICATION_COMMANDS: 1n << 31n,
    REQUEST_TO_SPEAK: 1n << 32n,
    MANAGE_EVENTS: 1n << 33n,
    MANAGE_THREADS: 1n << 34n,
    CREATE_PUBLIC_THREADS: 1n << 35n,
    CREATE_PRIVATE_THREADS: 1n << 36n,
    USE_EXTERNAL_STICKERS: 1n << 37n,
    SEND_MESSAGES_IN_THREADS: 1n << 38n,
    USE_EMBEDDED_ACTIVITIES: 1n << 39n,
    MODERATE_MEMBERS: 1n << 40n,
    VIEW_CREATOR_MONETIZATION_ANALYTICS: 1n << 41n,
    USE_SOUNDBOARD: 1n << 42n,
    CREATE_GUILD_EXPRESSIONS: 1n << 43n,
    CREATE_EVENTS: 1n << 44n,
    USE_EXTERNAL_SOUNDS: 1n << 45n,
    SEND_VOICE_MESSAGES: 1n << 46n,
    SET_VOICE_CHANNEL_STATUS: 1n << 48n,
    SEND_POLLS: 1n << 49n,
    USE_EXTERNAL_APPS: 1n << 50n,
    PIN_MESSAGES: 1n << 51n,
    BYPASS_SLOWMODE: 1n << 52n
}) { };

export type PermissionOverwriteTypeName = keyof typeof PermissionOverwriteType;
export type PermissionOverwriteType = typeof PermissionOverwriteType[PermissionOverwriteTypeName];
export const PermissionOverwriteType = defineEnum({
    ROLE: 0,
    MEMBER: 1
});

export type MessageTypeName = keyof typeof MessageType;
export type MessageType = typeof MessageType[MessageTypeName];
export const MessageType = defineEnum({
    DEFAULT: 0,
    RECIPIENT_ADD: 1,
    RECIPIENT_REMOVE: 2,
    CALL: 3,
    CHANNEL_NAME_CHANGE: 4,
    CHANNEL_ICON_CHANGE: 5,
    CHANNEL_PINNED_MESSAGE: 6,
    USER_JOIN: 7,
    GUILD_BOOST: 8,
    GUILD_BOOST_TIER_1: 9,
    GUILD_BOOST_TIER_2: 10,
    GUILD_BOOST_TIER_3: 11,
    CHANNEL_FOLLOW_ADD: 12,
    GUILD_DISCOVERY_DISQUALIFIED: 14,
    GUILD_DISCOVERY_REQUALIFIED: 15,
    GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING: 16,
    GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING: 17,
    THREAD_CREATED: 18,
    REPLY: 19,
    CHAT_INPUT_COMMAND: 20,
    THREAD_STARTER_MESSAGE: 21,
    GUILD_INVITE_REMINDER: 22,
    CONTEXT_MENU_COMMAND: 23,
    AUTO_MODERATION_ACTION: 24,
    ROLE_SUBSCRIPTION_PURCHASE: 25,
    INTERACTION_PREMIUM_UPSELL: 26,
    STAGE_START: 27,
    STAGE_END: 28,
    STAGE_SPEAKER: 29,
    STAGE_TOPIC: 31,
    GUILD_APPLICATION_PREMIUM_SUBSCRIPTION: 32,
    GUILD_INCIDENT_ALERT_MODE_ENABLED: 36,
    GUILD_INCIDENT_ALERT_MODE_DISABLED: 37,
    GUILD_INCIDENT_REPORT_RAID: 38,
    GUILD_INCIDENT_REPORT_FALSE_ALARM: 39,
    PURCHASE_NOTIFICATION: 44,
    POLL_RESULT: 46
});

export type MessageFlagsName = BitFlagNames<MessageFlags>;
export class MessageFlags extends defineBitFlags({
    CROSSPOSTED: 1 << 0,
    IS_CROSSPOST: 1 << 1,
    SUPPRESS_EMBEDS: 1 << 2,
    SOURCE_MESSAGE_DELETED: 1 << 3,
    URGENT: 1 << 4,
    HAS_THREAD: 1 << 5,
    EPHEMERAL: 1 << 6,
    LOADING: 1 << 7,
    FAILED_TO_MENTION_SOME_ROLES_IN_THREAD: 1 << 8,
    SUPPRESS_NOTIFICATIONS: 1 << 12,
    IS_VOICE_MESSAGE: 1 << 13,
    HAS_SNAPSHOT: 1 << 14,
    IS_COMPONENTS_V2: 1 << 15
}) { }

export type InteractionTypeName = keyof typeof InteractionType;
export type InteractionType = typeof InteractionType[InteractionTypeName];
export const InteractionType = defineEnum({
    PING: 1,
    APPLICATION_COMMAND: 2,
    MESSAGE_COMPONENT: 3,
    APPLICATION_COMMAND_AUTOCOMPLETE: 4,
    MODAL_SUBMIT: 5
});

export type InteractionCallbackTypeName = keyof typeof InteractionCallbackType;
export type InteractionCallbackType = typeof InteractionCallbackType[InteractionCallbackTypeName];
export const InteractionCallbackType = defineEnum({
    PONG: 1,
    CHANNEL_MESSAGE_WITH_SOURCE: 4,
    DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
    DEFERRED_UPDATE_MESSAGE: 6,
    UPDATE_MESSAGE: 7,
    APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
    MODAL: 9,
    PREMIUM_REQUIRED: 10,
    LAUNCH_ACTIVITY: 12
});

export type InteractionContextTypeName = keyof typeof InteractionContextType;
export type InteractionContextType = typeof InteractionContextType[InteractionContextTypeName];
export const InteractionContextType = defineEnum({
    GUILD: 0,
    BOT_DM: 1,
    PRIVATE_CHANNEL: 2
});

export type ApplicationCommandTypeName = keyof typeof ApplicationCommandType;
export type ApplicationCommandType = typeof ApplicationCommandType[ApplicationCommandTypeName];
export const ApplicationCommandType = defineEnum({
    CHAT_INPUT: 1,
    USER: 2,
    MESSAGE: 3,
    PRIMARY_ENTRY_POINT: 4
});

export type ApplicationCommandOptionTypeName = keyof typeof ApplicationCommandOptionType;
export type ApplicationCommandOptionType = typeof ApplicationCommandOptionType[ApplicationCommandOptionTypeName];
export const ApplicationCommandOptionType = defineEnum({
    SUB_COMMAND: 1,
    SUB_COMMAND_GROUP: 2,
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
    MENTIONABLE: 9,
    NUMBER: 10,
    ATTACHMENT: 11
});

export type ApplicationCommandPermissionTypeName = keyof typeof ApplicationCommandPermissionType;
export type ApplicationCommandPermissionType = typeof ApplicationCommandPermissionType[ApplicationCommandPermissionTypeName];
export const ApplicationCommandPermissionType = defineEnum({
    ROLE: 1,
    USER: 2,
    CHANNEL: 3
});

export type ComponentTypeName = keyof typeof ComponentType;
export type ComponentType = typeof ComponentType[ComponentTypeName];
export const ComponentType = defineEnum({
    ACTION_ROW: 1,
    BUTTON: 2,
    STRING_SELECT: 3,
    TEXT_INPUT: 4,
    USER_SELECT: 5,
    ROLE_SELECT: 6,
    MENTIONABLE_SELECT: 7,
    CHANNEL_SELECT: 8,
    SECTION: 9,
    TEXT_DISPLAY: 10,
    THUMBNAIL: 11,
    MEDIA_GALLERY: 12,
    FILE: 13,
    SEPARATOR: 14,
    CONTAINER: 17,
    LABEL: 18,
    FILE_UPLOAD: 19,
    RADIO_GROUP: 21,
    CHECKBOX_GROUP: 22,
    CHECKBOX: 23
});

export type ButtonStyleName = keyof typeof ButtonStyle;
export type ButtonStyle = typeof ButtonStyle[ButtonStyleName];
export const ButtonStyle = defineEnum({
    PRIMARY: 1,
    SECONDARY: 2,
    SUCCESS: 3,
    DANGER: 4,
    LINK: 5,
    PREMIUM: 6
});

export type TextInputStyleName = keyof typeof TextInputStyle;
export type TextInputStyle = typeof TextInputStyle[TextInputStyleName];
export const TextInputStyle = defineEnum({
    SHORT: 1,
    PARAGRAPH: 2
});

export type DefaultMessageNotificationLevelName = keyof typeof DefaultMessageNotificationLevel;
export type DefaultMessageNotificationLevel = typeof DefaultMessageNotificationLevel[DefaultMessageNotificationLevelName];
export const DefaultMessageNotificationLevel = defineEnum({
    ALL_MESSAGES: 0,
    ONLY_MENTIONS: 1
});

export type ExplicitContentFilterLevelName = keyof typeof ExplicitContentFilterLevel;
export type ExplicitContentFilterLevel = typeof ExplicitContentFilterLevel[ExplicitContentFilterLevelName];
export const ExplicitContentFilterLevel = defineEnum({
    DISABLED: 0,
    MEMBERS_WITHOUT_ROLES: 1,
    ALL_MEMBERS: 2
});

export type MFALevelName = keyof typeof MFALevel;
export type MFALevel = typeof MFALevel[MFALevelName];
export const MFALevel = defineEnum({
    NONE: 0,
    ELEVATED: 1
});

export type VerificationLevelName = keyof typeof VerificationLevel;
export type VerificationLevel = typeof VerificationLevel[VerificationLevelName];
export const VerificationLevel = defineEnum({
    NONE: 0,
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    VERY_HIGH: 4
});

export type GuildNSFWLevelName = keyof typeof GuildNSFWLevel;
export type GuildNSFWLevel = typeof GuildNSFWLevel[GuildNSFWLevelName];
export const GuildNSFWLevel = defineEnum({
    DEFAULT: 0,
    EXPLICIT: 1,
    SAFE: 2,
    AGE_RESTRICTED: 3
});

export type PremiumTierName = keyof typeof PremiumTier;
export type PremiumTier = typeof PremiumTier[PremiumTierName];
export const PremiumTier = defineEnum({
    NONE: 0,
    TIER_1: 1,
    TIER_2: 2,
    TIER_3: 3
});

export type SystemChannelFlagsName = BitFlagNames<SystemChannelFlags>;
export class SystemChannelFlags extends defineBitFlags({
    SUPPRESS_JOIN_NOTIFICATIONS: 1 << 0,
    SUPPRESS_PREMIUM_SUBSCRIPTIONS: 1 << 1,
    SUPPRESS_GUILD_REMINDER_NOTIFICATIONS: 1 << 2,
    SUPPRESS_JOIN_NOTIFICATION_REPLIES: 1 << 3,
    SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATIONS: 1 << 4,
    SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATION_REPLIES: 1 << 5
}) { }

export type GuildScheduledEventPrivacyLevelName = keyof typeof GuildScheduledEventPrivacyLevel;
export type GuildScheduledEventPrivacyLevel = typeof GuildScheduledEventPrivacyLevel[GuildScheduledEventPrivacyLevelName];
export const GuildScheduledEventPrivacyLevel = defineEnum({
    GUILD_ONLY: 2
});

export type GuildScheduledEventEntityTypeName = keyof typeof GuildScheduledEventEntityType;
export type GuildScheduledEventEntityType = typeof GuildScheduledEventEntityType[GuildScheduledEventEntityTypeName];
export const GuildScheduledEventEntityType = defineEnum({
    STAGE_INSTANCE: 1,
    VOICE: 2,
    EXTERNAL: 3
});

export type GuildScheduledEventStatusName = keyof typeof GuildScheduledEventStatus;
export type GuildScheduledEventStatus = typeof GuildScheduledEventStatus[GuildScheduledEventStatusName];
export const GuildScheduledEventStatus = defineEnum({
    SCHEDULED: 1,
    ACTIVE: 2,
    COMPLETED: 3,
    CANCELED: 4
});

export type AutoModerationTriggerTypeName = keyof typeof AutoModerationTriggerType;
export type AutoModerationTriggerType = typeof AutoModerationTriggerType[AutoModerationTriggerTypeName];
export const AutoModerationTriggerType = defineEnum({
    KEYWORD: 1,
    SPAM: 3,
    KEYWORD_PRESET: 4,
    MENTION_SPAM: 5,
    MEMBER_PROFILE: 6
});

export type AutoModerationEventTypeName = keyof typeof AutoModerationEventType;
export type AutoModerationEventType = typeof AutoModerationEventType[AutoModerationEventTypeName];
export const AutoModerationEventType = defineEnum({
    MESSAGE_SEND: 1,
    MEMBER_UPDATE: 2
});

export type AutoModerationActionTypeName = keyof typeof AutoModerationActionType;
export type AutoModerationActionType = typeof AutoModerationActionType[AutoModerationActionTypeName];
export const AutoModerationActionType = defineEnum({
    BLOCK_MESSAGE: 1,
    SEND_ALERT_MESSAGE: 2,
    TIMEOUT: 3,
    BLOCK_MEMBER_INTERACTION: 4
});

export type InviteTypeName = keyof typeof InviteType;
export type InviteType = typeof InviteType[InviteTypeName];
export const InviteType = defineEnum({
    GUILD: 0,
    GROUP_DM: 1,
    FRIEND: 2
});

export type InviteTargetTypeName = keyof typeof InviteTargetType;
export type InviteTargetType = typeof InviteTargetType[InviteTargetTypeName];
export const InviteTargetType = defineEnum({
    STREAM: 1,
    EMBEDDED_APPLICATION: 2
});

export type WebhookTypeName = keyof typeof WebhookType;
export type WebhookType = typeof WebhookType[WebhookTypeName];
export const WebhookType = defineEnum({
    INCOMING: 1,
    CHANNEL_FOLLOWER: 2,
    APPLICATION: 3
});

export type GuildInviteFlagsName = BitFlagNames<GuildInviteFlags>;
export class GuildInviteFlags extends defineBitFlags({
    IS_GUEST_INVITE: 1 << 0
}) { }

export type VideoQualityModeName = keyof typeof VideoQualityMode;
export type VideoQualityMode = typeof VideoQualityMode[VideoQualityModeName];
export const VideoQualityMode = defineEnum({
    AUTO: 1,
    FULL: 2
});

export type ForumSortOrderName = keyof typeof ForumSortOrder;
export type ForumSortOrder = typeof ForumSortOrder[ForumSortOrderName];
export const ForumSortOrder = defineEnum({
    LATEST_ACTIVITY: 0,
    CREATION_DATE: 1
});

export type ForumLayoutTypeName = keyof typeof ForumLayoutType;
export type ForumLayoutType = typeof ForumLayoutType[ForumLayoutTypeName];
export const ForumLayoutType = defineEnum({
    NOT_SET: 0,
    LIST_VIEW: 1,
    GALLERY_VIEW: 2
});

export type AutoArchiveDurationName = keyof typeof AutoArchiveDuration;
export type AutoArchiveDuration = typeof AutoArchiveDuration[AutoArchiveDurationName];
export const AutoArchiveDuration = defineEnum({
    HOUR: 60,
    DAY: 1440,
    DAY_3: 4320,
    WEEK: 10080
});
