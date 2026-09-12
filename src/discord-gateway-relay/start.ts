import { randomUUID } from 'node:crypto';

import { config } from '@blargbot/config';
import type { DiscordGatewayDispatch, DiscordGatewayDispatchMapping, DispatchEvent, KnownDiscordGatewayDispatch } from '@blargbot/contracts';
import { AmqpConnection, getDiscordGatewayChannel } from '@blargbot/contracts';
import { createLogger } from '@blargbot/logger';
import { createId, whenAborted } from '@blargbot/util';
import type { DiscordChannel } from '@discordeno/types';

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
    if (message.t in handlers)
        await handlers[message.t as keyof typeof handlers](message);
    // New message the bot hasnt been built to handle yet, do a best effort attempt to route it.
    else if ('guild_id' in message.d && typeof message.d.guild_id === 'string')
        await relay(message, `guild:${message.d.guild_id}`);
    else if ('channel_id' in message.d && typeof message.d.channel_id === 'string')
        await relay(message, `channel:${message.d.channel_id}`);
    else if ('user_id' in message.d && typeof message.d.user_id === 'string')
        await relay(message, `user:${message.d.user_id}`);
    else
        await relay(message, `system:${randomUUID()}`);
});

async function relay(message: DiscordGatewayDispatch, key: `${'guild' | 'channel' | 'user' | 'system'}:${string}`): Promise<void> {
    await gateway.publish(message, key);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
async function asGuildMessage(message: Extract<KnownDiscordGatewayDispatch, { d: { guild_id: string; }; }>): Promise<void> {
    await relay(message, `guild:${message.d.guild_id}`);
}
async function asGuildSelfMessage(message: Extract<KnownDiscordGatewayDispatch, { d: { id: string; }; }>): Promise<void> {
    await relay(message, `guild:${message.d.id}`);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
async function asChannelMessage(message: Extract<KnownDiscordGatewayDispatch, { d: { id: string; guild_id?: string; }; }>): Promise<void> {
    if (message.d.guild_id !== undefined)
        await relay(message, `guild:${message.d.guild_id}`);
    else
        await relay(message, `channel:${message.d.id}`);
}

const handlers = {
    async READY(message) {
        await Promise.all(message.d.guilds.map(guild => relay({
            ...message,
            t: 'GUILD_CREATE',
            d: guild
        }, `guild:${guild.id} `)));
    },
    RESUMED() { },
    RATE_LIMITED() { },
    APPLICATION_COMMAND_PERMISSIONS_UPDATE: asGuildMessage,
    AUTO_MODERATION_RULE_CREATE: asGuildMessage,
    AUTO_MODERATION_RULE_UPDATE: asGuildMessage,
    AUTO_MODERATION_RULE_DELETE: asGuildMessage,
    AUTO_MODERATION_ACTION_EXECUTION: asGuildMessage,
    CHANNEL_CREATE: asChannelMessage,
    CHANNEL_UPDATE: asChannelMessage,
    CHANNEL_DELETE: asChannelMessage,
    async CHANNEL_PINS_UPDATE(message) {
        if (message.d.guild_id !== undefined)
            await relay(message, `guild:${message.d.guild_id} `);
        else
            await relay(message, `channel:${message.d.channel_id} `);
    },
    CHANNEL_INFO: asGuildMessage,
    VOICE_CHANNEL_STATUS_UPDATE: asGuildMessage,
    VOICE_CHANNEL_START_TIME_UPDATE: asGuildMessage,
    THREAD_CREATE: asChannelMessage,
    THREAD_UPDATE: asChannelMessage,
    THREAD_DELETE: asChannelMessage,
    THREAD_LIST_SYNC: asGuildMessage,
    THREAD_MEMBER_UPDATE: asGuildMessage,
    THREAD_MEMBERS_UPDATE: asGuildMessage,
    GUILD_AUDIT_LOG_ENTRY_CREATE: asGuildMessage,
    GUILD_CREATE: asGuildSelfMessage,
    GUILD_UPDATE: asGuildSelfMessage,
    GUILD_DELETE: asGuildSelfMessage,
    GUILD_BAN_ADD: asGuildMessage,
    GUILD_BAN_REMOVE: asGuildMessage,
    GUILD_EMOJIS_UPDATE: asGuildMessage,
    GUILD_STICKERS_UPDATE: asGuildMessage,
    GUILD_INTEGRATIONS_UPDATE: asGuildMessage,
    GUILD_MEMBER_REMOVE: asGuildMessage,
    GUILD_MEMBER_UPDATE: asGuildMessage,
    GUILD_MEMBERS_CHUNK: asGuildMessage,
    GUILD_ROLE_UPDATE: asGuildMessage,
    GUILD_ROLE_DELETE: asGuildMessage,
    GUILD_SCHEDULED_EVENT_CREATE: asGuildMessage,
    GUILD_SCHEDULED_EVENT_UPDATE: asGuildMessage,
    GUILD_SCHEDULED_EVENT_DELETE: asGuildMessage,
    GUILD_SCHEDULED_EVENT_USER_ADD: asGuildMessage,
    GUILD_SCHEDULED_EVENT_USER_REMOVE: asGuildMessage,
    async GUILD_SOUNDBOARD_SOUND_CREATE(message) {
        if (message.d.guild_id !== undefined)
            await relay(message, `guild:${message.d.guild_id} `);
    },
    async GUILD_SOUNDBOARD_SOUND_UPDATE(message) {
        if (message.d.guild_id !== undefined)
            await relay(message, `guild:${message.d.guild_id} `);
    },
    GUILD_SOUNDBOARD_SOUND_DELETE: asGuildMessage,
    GUILD_SOUNDBOARD_SOUNDS_UPDATE: asGuildMessage,
    INTEGRATION_CREATE: asGuildMessage,
    INTEGRATION_UPDATE: asGuildMessage,
    INTEGRATION_DELETE: asGuildMessage,
    async INTERACTION_CREATE(message) {
        if (message.d.guild_id !== undefined)
            await relay(message, `guild:${message.d.guild_id} `);
        else if (message.d.message?.guild_id !== undefined)
            await relay(message, `guild:${message.d.message.guild_id} `);
        else if (message.d.channel_id !== undefined)
            await relay(message, `channel:${message.d.channel_id} `);
        else if (message.d.channel.id !== undefined)
            await relay(message, `channel:${message.d.channel.id} `);
        else if (message.d.message?.channel_id !== undefined)
            await relay(message, `channel:${message.d.message.channel_id} `);
        else if (message.d.user?.id !== undefined)
            await relay(message, `user:${message.d.user.id} `);
        else
            await relay(message, `system:${randomUUID()} `);
    },
    INVITE_CREATE: asChannelMessage,
    INVITE_DELETE: asChannelMessage,
    async MESSAGE_CREATE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async MESSAGE_UPDATE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async MESSAGE_DELETE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async MESSAGE_DELETE_BULK(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async MESSAGE_REACTION_ADD(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async MESSAGE_REACTION_REMOVE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async MESSAGE_REACTION_REMOVE_ALL(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async MESSAGE_REACTION_REMOVE_EMOJI(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    PRESENCE_UPDATE: asGuildMessage,
    STAGE_INSTANCE_CREATE: asGuildMessage,
    STAGE_INSTANCE_UPDATE: asGuildMessage,
    STAGE_INSTANCE_DELETE: asGuildMessage,
    async TYPING_START(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async USER_UPDATE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async VOICE_CHANNEL_EFFECT_SEND(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async VOICE_STATE_UPDATE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    VOICE_SERVER_UPDATE: asGuildMessage,
    async ENTITLEMENT_CREATE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async ENTITLEMENT_UPDATE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async ENTITLEMENT_DELETE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async SUBSCRIPTION_CREATE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async SUBSCRIPTION_UPDATE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async SUBSCRIPTION_DELETE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async MESSAGE_POLL_VOTE_ADD(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    },
    async MESSAGE_POLL_VOTE_REMOVE(message) {
        await relay(message, `guild:${message.d.guild_id} `);
    }
} satisfies { [P in keyof DiscordGatewayDispatchMapping]: (message: DiscordGatewayDispatchMapping[P]) => Awaitable<void> };
