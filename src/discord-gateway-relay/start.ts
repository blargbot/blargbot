import { randomUUID } from 'node:crypto';

import { config } from '@blargbot/config';
import { AmqpConnection, getDiscordGatewayChannel } from '@blargbot/contracts';
import { createLogger } from '@blargbot/logger';
import { createId, whenAborted } from '@blargbot/util';
import type { DiscordAuditLogEntry, DiscordAutoModerationActionExecution, DiscordAutoModerationRule, DiscordChannel, DiscordChannelPinsUpdate, DiscordEntitlement, DiscordGuild, DiscordGuildApplicationCommandPermissions, DiscordGuildAuditLogEntryCreateExtra, DiscordGuildBanAdd, DiscordGuildBanRemove, DiscordGuildCreateExtra, DiscordGuildEmojisUpdate, DiscordGuildIntegrationsUpdate, DiscordGuildMemberAdd, DiscordGuildMemberRemove, DiscordGuildMembersChunk, DiscordGuildMemberUpdate, DiscordGuildRoleCreate, DiscordGuildRoleDelete, DiscordGuildRoleUpdate, DiscordGuildStickersUpdate, DiscordIntegrationCreateUpdate, DiscordIntegrationDelete, DiscordInteraction, DiscordInviteCreate, DiscordInviteDelete, DiscordMessage, DiscordMessageDelete, DiscordMessageDeleteBulk, DiscordMessageReactionAdd, DiscordMessageReactionRemove, DiscordMessageReactionRemoveAll, DiscordMessageReactionRemoveEmoji, DiscordPollVoteAdd, DiscordPollVoteRemove, DiscordPresenceUpdate, DiscordRateLimited, DiscordReady, DiscordScheduledEvent, DiscordScheduledEventUserAdd, DiscordScheduledEventUserRemove, DiscordSoundboardSound, DiscordSoundboardSoundDelete, DiscordSoundboardSounds, DiscordSoundboardSoundsUpdate, DiscordStageInstance, DiscordSubscription, DiscordThreadCreateExtra, DiscordThreadListSync, DiscordThreadMembersUpdate, DiscordThreadMemberUpdate, DiscordTypingStart, DiscordUnavailableGuild, DiscordUser, DiscordVoiceChannelEffectSend, DiscordVoiceServerUpdate, DiscordVoiceState, DiscordWebhookUpdate } from '@discordeno/types';

const clusterId = createId();
const logger = createLogger(config, `CLUSTER ${clusterId}`);
logger.setGlobal();

const amqp = new AmqpConnection(config.amqp.url);
amqp.onError(err => logger.error('[AMQP]', err));
amqp.onConnected(signal => {
    logger.init('[AMQP] internal connection established.');
    whenAborted(signal, () => logger.warn('[AMQP] internal connection closed.'));
});
const amqpChannel = amqp.createChannel();

const gateway = await getDiscordGatewayChannel(amqpChannel);
await gateway.handleDeduped(async message => {
    let routingKey: string | undefined;
    if (typeof message.t !== 'string') {
        routingKey = 'global:system';
    } else {

        const key = message.t;

        if (Reflect.has(getKeyFor, key)) {
            const result = getKeyFor[key as keyof typeof getKeyFor](message.d as never);
            if (result !== undefined)
                routingKey = result;
        }
        if (routingKey === undefined) {
            if (typeof message.d !== 'object' || message.d === null)
                routingKey = `global:${randomUUID()}`;
            else if (hasStringKey(message.d, 'guild_id'))
                routingKey = `guild:${message.d.guild_id}`;
            else if (hasStringKey(message.d, 'channel_id'))
                routingKey = `channel:${message.d.channel_id}`;
            else if (hasStringKey(message.d, 'user_id'))
                routingKey = `user:${message.d.user_id}`;
            else
                routingKey = `global:${randomUUID()}`;
        }
    }

    await gateway.publish(message, routingKey);
});

function hasStringKey<Target extends object, const Key extends PropertyKey>(target: Target, key: Key): target is Target & { [P in Key]: string; } {
    return key in target && typeof target[key as never] === 'string';
}

const getKeyFor = {
    READY() {
        return undefined;
    },
    RESUMED() {
        return undefined;
    },
    RATE_LIMITED() {
        return undefined;
    },
    APPLICATION_COMMAND_PERMISSIONS_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    AUTO_MODERATION_RULE_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    AUTO_MODERATION_RULE_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    AUTO_MODERATION_RULE_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    AUTO_MODERATION_ACTION_EXECUTION(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    CHANNEL_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.id === 'string')
            return `channel:${message.id}`;
        return undefined;
    },
    CHANNEL_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.id === 'string')
            return `channel:${message.id}`;
        return undefined;
    },
    CHANNEL_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.id === 'string')
            return `channel:${message.id}`;
        return undefined;
    },
    CHANNEL_PINS_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    CHANNEL_INFO(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    VOICE_CHANNEL_STATUS_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    VOICE_CHANNEL_START_TIME_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    THREAD_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.parent_id === 'string')
            return `channel:${message.parent_id}`;
        if (typeof message.id === 'string')
            return `channel:${message.id}`;
        return undefined;
    },
    THREAD_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.parent_id === 'string')
            return `channel:${message.parent_id}`;
        if (typeof message.id === 'string')
            return `channel:${message.id}`;
        return undefined;
    },
    THREAD_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.parent_id === 'string')
            return `channel:${message.parent_id}`;
        if (typeof message.id === 'string')
            return `channel:${message.id}`;
        return undefined;
    },
    THREAD_LIST_SYNC(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    THREAD_MEMBER_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    THREAD_MEMBERS_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_AUDIT_LOG_ENTRY_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_CREATE(message) {
        if (typeof message.id === 'string')
            return `guild:${message.id}`;
        return undefined;
    },
    GUILD_UPDATE(message) {
        if (typeof message.id === 'string')
            return `guild:${message.id}`;
        return undefined;
    },
    GUILD_DELETE(message) {
        if (typeof message.id === 'string')
            return `guild:${message.id}`;
        return undefined;
    },
    GUILD_BAN_ADD(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_BAN_REMOVE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_EMOJIS_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_STICKERS_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_INTEGRATIONS_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_MEMBER_ADD(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_MEMBER_REMOVE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_MEMBER_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_MEMBERS_CHUNK(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_ROLE_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_ROLE_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_ROLE_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_SCHEDULED_EVENT_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_SCHEDULED_EVENT_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_SCHEDULED_EVENT_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_SCHEDULED_EVENT_USER_ADD(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_SCHEDULED_EVENT_USER_REMOVE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_SOUNDBOARD_SOUND_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_SOUNDBOARD_SOUND_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_SOUNDBOARD_SOUND_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    GUILD_SOUNDBOARD_SOUNDS_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    SOUNDBOARD_SOUNDS(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    INTEGRATION_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    INTEGRATION_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    INTEGRATION_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    INTERACTION_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        if (typeof message.channel.id === 'string')
            return `channel:${message.channel.id}`;
        if (typeof message.user?.id === 'string')
            return `user:${message.user.id}`;
        return undefined;
    },
    INVITE_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    INVITE_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    MESSAGE_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    MESSAGE_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    MESSAGE_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    MESSAGE_DELETE_BULK(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    MESSAGE_REACTION_ADD(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    MESSAGE_REACTION_REMOVE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    MESSAGE_REACTION_REMOVE_ALL(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    MESSAGE_REACTION_REMOVE_EMOJI(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    PRESENCE_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    STAGE_INSTANCE_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    STAGE_INSTANCE_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    STAGE_INSTANCE_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    TYPING_START(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    USER_UPDATE(message) {
        if (typeof message.id === 'string')
            return `user:${message.id}`;
        return undefined;
    },
    VOICE_CHANNEL_EFFECT_SEND(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    VOICE_STATE_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        if (typeof message.user_id === 'string')
            return `user:${message.user_id}`;
        return undefined;
    },
    VOICE_SERVER_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    WEBHOOKS_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        return undefined;
    },
    ENTITLEMENT_CREATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.user_id === 'string')
            return `user:${message.user_id}`;
        return undefined;
    },
    ENTITLEMENT_UPDATE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.user_id === 'string')
            return `user:${message.user_id}`;
        return undefined;
    },
    ENTITLEMENT_DELETE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.user_id === 'string')
            return `user:${message.user_id}`;
        return undefined;
    },
    SUBSCRIPTION_CREATE(message) {
        if (typeof message.user_id === 'string')
            return `user:${message.user_id}`;
        return undefined;
    },
    SUBSCRIPTION_UPDATE(message) {
        if (typeof message.user_id === 'string')
            return `user:${message.user_id}`;
        return undefined;
    },
    SUBSCRIPTION_DELETE(message) {
        if (typeof message.user_id === 'string')
            return `user:${message.user_id}`;
        return undefined;
    },
    MESSAGE_POLL_VOTE_ADD(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    },
    MESSAGE_POLL_VOTE_REMOVE(message) {
        if (typeof message.guild_id === 'string')
            return `guild:${message.guild_id}`;
        if (typeof message.channel_id === 'string')
            return `channel:${message.channel_id}`;
        return undefined;
    }
} satisfies { [P in keyof GatewayIdMappings]: (message: GatewayIdMappings[P]) => string | undefined; };

type GatewayIdMappings = {
    /* eslint-disable @typescript-eslint/naming-convention */
    'READY': DiscordReady;
    'RESUMED': unknown;
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
};
interface DiscordChannelInfo {
    guild_id: string;
    channels: DiscordChannelInfoChannel[];
}

interface DiscordChannelInfoChannel {
    id: string;
    status?: string | null;
    voice_start_time?: number | null;
}

interface DiscordVoiceChannelStatusUpdate {
    id: string;
    guild_id: string;
    status: string | null;
}

interface DiscordVoiceChannelStartTimeUpdate {
    id: string;
    guild_id: string;
    voice_start_time?: number | null;
}
