import type { DiscordAuditLogEntry, DiscordAutoModerationActionExecution, DiscordAutoModerationRule, DiscordChannel, DiscordChannelPinsUpdate, DiscordEntitlement, DiscordGuild, DiscordGuildApplicationCommandPermissions, DiscordGuildAuditLogEntryCreateExtra, DiscordGuildBanAdd, DiscordGuildBanRemove, DiscordGuildCreateExtra, DiscordGuildEmojisUpdate, DiscordGuildIntegrationsUpdate, DiscordGuildMemberAdd, DiscordGuildMemberRemove, DiscordGuildMembersChunk, DiscordGuildMemberUpdate, DiscordGuildRoleCreate, DiscordGuildRoleDelete, DiscordGuildRoleUpdate, DiscordGuildStickersUpdate, DiscordIntegrationCreateUpdate, DiscordIntegrationDelete, DiscordInteraction, DiscordInviteCreate, DiscordInviteDelete, DiscordMessage, DiscordMessageDelete, DiscordMessageDeleteBulk, DiscordMessageReactionAdd, DiscordMessageReactionRemove, DiscordMessageReactionRemoveAll, DiscordMessageReactionRemoveEmoji, DiscordPollVoteAdd, DiscordPollVoteRemove, DiscordPresenceUpdate, DiscordRateLimited, DiscordReady, DiscordScheduledEvent, DiscordScheduledEventUserAdd, DiscordScheduledEventUserRemove, DiscordSoundboardSound, DiscordSoundboardSoundDelete, DiscordSoundboardSounds, DiscordSoundboardSoundsUpdate, DiscordStageInstance, DiscordSubscription, DiscordThreadCreateExtra, DiscordThreadListSync, DiscordThreadMembersUpdate, DiscordThreadMemberUpdate, DiscordTypingStart, DiscordUnavailableGuild, DiscordUser, DiscordVoiceChannelEffectSend, DiscordVoiceServerUpdate, DiscordVoiceState, DiscordWebhookUpdate, GatewayEventNames } from '@discordeno/types';
import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-useless-assignment
export const DiscordGatewayDispatch = amqpJsonCodec(z.object({
    op: z.literal(0),
    d: z.unknown(),
    s: z.int(),
    t: z.string(),
    shardId: z.int(),
    totalShards: z.int()
}) as z.ZodType<DiscordGatewayDispatch, DiscordGatewayDispatch>);
export type DiscordGatewayDispatch = KnownDiscordGatewayDispatch | DispatchEvent<string, object>;
export type KnownDiscordGatewayDispatch = DiscordGatewayDispatchMapping[keyof DiscordGatewayDispatchMapping];
export type DiscordGatewayDispatchMapping = { [P in keyof GatewayDispatchMapping]: DispatchEvent<P, GatewayDispatchMapping[P]> }

export type DispatchEvent<Type extends string, Data extends object> = {
    op: 0;
    t: Type;
    d: Data;
    s: number;
    shardId: number;
    totalShards: number;
}

/* eslint-disable @typescript-eslint/naming-convention */
export type GatewayDispatchMapping = AssertAllKeys<GatewayEventNames, {
    'READY': DiscordReady;
    'RESUMED': {};
    'RATE_LIMITED': DiscordRateLimited;
    'APPLICATION_COMMAND_PERMISSIONS_UPDATE': DiscordGuildApplicationCommandPermissions;
    'AUTO_MODERATION_RULE_CREATE': DiscordAutoModerationRule;
    'AUTO_MODERATION_RULE_UPDATE': DiscordAutoModerationRule;
    'AUTO_MODERATION_RULE_DELETE': DiscordAutoModerationRule;
    'AUTO_MODERATION_ACTION_EXECUTION': DiscordAutoModerationActionExecution;
    'CHANNEL_CREATE': DiscordChannel;
    'CHANNEL_UPDATE': DiscordChannel;
    'CHANNEL_DELETE': DiscordChannel;
    'CHANNEL_PINS_UPDATE': DiscordChannelPinsUpdate;
    'CHANNEL_INFO': DiscordChannelInfo;
    'VOICE_CHANNEL_STATUS_UPDATE': DiscordVoiceChannelStatusUpdate;
    'VOICE_CHANNEL_START_TIME_UPDATE': DiscordVoiceChannelStartTimeUpdate;
    'THREAD_CREATE': DiscordChannel & DiscordThreadCreateExtra;
    'THREAD_UPDATE': DiscordChannel;
    'THREAD_DELETE': DiscordChannel;
    'THREAD_LIST_SYNC': DiscordThreadListSync;
    'THREAD_MEMBER_UPDATE': DiscordThreadMemberUpdate;
    'THREAD_MEMBERS_UPDATE': DiscordThreadMembersUpdate;
    'GUILD_AUDIT_LOG_ENTRY_CREATE': DiscordAuditLogEntry & DiscordGuildAuditLogEntryCreateExtra;
    'GUILD_CREATE': DiscordGuild & DiscordGuildCreateExtra | DiscordUnavailableGuild;
    'GUILD_UPDATE': DiscordGuild;
    'GUILD_DELETE': DiscordUnavailableGuild;
    'GUILD_BAN_ADD': DiscordGuildBanAdd;
    'GUILD_BAN_REMOVE': DiscordGuildBanRemove;
    'GUILD_EMOJIS_UPDATE': DiscordGuildEmojisUpdate;
    'GUILD_STICKERS_UPDATE': DiscordGuildStickersUpdate;
    'GUILD_INTEGRATIONS_UPDATE': DiscordGuildIntegrationsUpdate;
    'GUILD_MEMBER_ADD': DiscordGuildMemberAdd;
    'GUILD_MEMBER_REMOVE': DiscordGuildMemberRemove;
    'GUILD_MEMBER_UPDATE': DiscordGuildMemberUpdate;
    'GUILD_MEMBERS_CHUNK': DiscordGuildMembersChunk;
    'GUILD_ROLE_CREATE': DiscordGuildRoleCreate;
    'GUILD_ROLE_UPDATE': DiscordGuildRoleUpdate;
    'GUILD_ROLE_DELETE': DiscordGuildRoleDelete;
    'GUILD_SCHEDULED_EVENT_CREATE': DiscordScheduledEvent;
    'GUILD_SCHEDULED_EVENT_UPDATE': DiscordScheduledEvent;
    'GUILD_SCHEDULED_EVENT_DELETE': DiscordScheduledEvent;
    'GUILD_SCHEDULED_EVENT_USER_ADD': DiscordScheduledEventUserAdd;
    'GUILD_SCHEDULED_EVENT_USER_REMOVE': DiscordScheduledEventUserRemove;
    'GUILD_SOUNDBOARD_SOUND_CREATE': DiscordSoundboardSound;
    'GUILD_SOUNDBOARD_SOUND_UPDATE': DiscordSoundboardSound;
    'GUILD_SOUNDBOARD_SOUND_DELETE': DiscordSoundboardSoundDelete;
    'GUILD_SOUNDBOARD_SOUNDS_UPDATE': DiscordSoundboardSoundsUpdate;
    'SOUNDBOARD_SOUNDS': DiscordSoundboardSounds;
    'INTEGRATION_CREATE': DiscordIntegrationCreateUpdate;
    'INTEGRATION_UPDATE': DiscordIntegrationCreateUpdate;
    'INTEGRATION_DELETE': DiscordIntegrationDelete;
    'INTERACTION_CREATE': DiscordInteraction;
    'INVITE_CREATE': DiscordInviteCreate;
    'INVITE_DELETE': DiscordInviteDelete;
    'MESSAGE_CREATE': DiscordMessage;
    'MESSAGE_UPDATE': Partial<DiscordMessage> & Pick<DiscordMessage, 'id' | 'channel_id'>;
    'MESSAGE_DELETE': DiscordMessageDelete;
    'MESSAGE_DELETE_BULK': DiscordMessageDeleteBulk;
    'MESSAGE_REACTION_ADD': DiscordMessageReactionAdd;
    'MESSAGE_REACTION_REMOVE': DiscordMessageReactionRemove;
    'MESSAGE_REACTION_REMOVE_ALL': DiscordMessageReactionRemoveAll;
    'MESSAGE_REACTION_REMOVE_EMOJI': DiscordMessageReactionRemoveEmoji;
    'PRESENCE_UPDATE': DiscordPresenceUpdate;
    'STAGE_INSTANCE_CREATE': DiscordStageInstance;
    'STAGE_INSTANCE_UPDATE': DiscordStageInstance;
    'STAGE_INSTANCE_DELETE': DiscordStageInstance;
    'TYPING_START': DiscordTypingStart;
    'USER_UPDATE': DiscordUser;
    'VOICE_CHANNEL_EFFECT_SEND': DiscordVoiceChannelEffectSend;
    'VOICE_STATE_UPDATE': DiscordVoiceState;
    'VOICE_SERVER_UPDATE': DiscordVoiceServerUpdate;
    'WEBHOOKS_UPDATE': DiscordWebhookUpdate;
    'ENTITLEMENT_CREATE': DiscordEntitlement;
    'ENTITLEMENT_UPDATE': DiscordEntitlement;
    'ENTITLEMENT_DELETE': DiscordEntitlement;
    'SUBSCRIPTION_CREATE': DiscordSubscription;
    'SUBSCRIPTION_UPDATE': DiscordSubscription;
    'SUBSCRIPTION_DELETE': DiscordSubscription;
    'MESSAGE_POLL_VOTE_ADD': DiscordPollVoteAdd;
    'MESSAGE_POLL_VOTE_REMOVE': DiscordPollVoteRemove;
}>

type AssertAllKeys<Keys extends PropertyKey, Value extends { [P in Keys]: unknown }> = Value;

export interface DiscordChannelInfo {
    guild_id: string;
    channels: DiscordChannelInfoChannel[];
}

export interface DiscordChannelInfoChannel {
    id: string;
    status?: string | null;
    voice_start_time?: number | null;
}

export interface DiscordVoiceChannelStatusUpdate {
    id: string;
    guild_id: string;
    status: string | null;
}

export interface DiscordVoiceChannelStartTimeUpdate {
    id: string;
    guild_id: string;
    voice_start_time?: number | null;
}
