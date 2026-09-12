import { randomUUID } from 'node:crypto';

import type { DiscordGatewayDispatch, DiscordGatewayDispatchMapping, KnownDiscordGatewayDispatch } from '@blargbot/contracts';

type Yield = [message: DiscordGatewayDispatch, key: string];

export function relayMessage(message: DiscordGatewayDispatch): Generator<Yield> {
    const $message = message as KnownDiscordGatewayDispatch;
    if ($message.t in handlers)
        return handlers[$message.t]($message as never);
    return routeAs.none($message);
}

function makeRelay(entityType: string): (message: Extract<KnownDiscordGatewayDispatch, { d: { id: string; }; }>) => Generator<Yield>;
function makeRelay(entityType: undefined): (message: KnownDiscordGatewayDispatch) => Generator<Yield>;
function makeRelay(entityType: string | undefined) {
    return function* relay(message: KnownDiscordGatewayDispatch): Generator<Yield> {
        if ('guild_id' in message.d && typeof message.d.guild_id === 'string')
            yield [message, `guild:${message.d.guild_id}`];
        else if ('channel_id' in message.d && typeof message.d.channel_id === 'string')
            yield [message, `channel:${message.d.channel_id}`];
        else if ('user_id' in message.d && typeof message.d.user_id === 'string')
            yield [message, `user:${message.d.user_id}`];
        else if (entityType !== undefined && 'id' in message.d && typeof message.d.id === 'string')
            yield [message, `${entityType}:${message.d.id}`];
        else
            yield [message, `unknown:${randomUUID()}`];
    };
}

const routeAs = {
    user: makeRelay('user'),
    command: makeRelay('command'),
    guild: makeRelay('guild'),
    message: makeRelay('message'),
    audit: makeRelay('audit'),
    stage: makeRelay('stage'),
    channel: makeRelay('channel'),
    automod: makeRelay('automod'),
    subscription: makeRelay('subscription'),
    entitlement: makeRelay('entitlement'),
    interaction: makeRelay('interaction'),
    integration: makeRelay('integration'),
    event: makeRelay('event'),
    none: makeRelay(undefined)
};

function* empty(): Generator<Yield> { }
const handlers: { [P in keyof DiscordGatewayDispatchMapping]: (message: DiscordGatewayDispatchMapping[P]) => Generator<Yield> } = {
    * READY(message) {
        for (const guild of message.d.guilds) {
            yield* routeAs.guild({
                ...message,
                t: 'GUILD_CREATE',
                d: guild
            });
        }
    },
    RESUMED: empty,
    RATE_LIMITED: empty,
    APPLICATION_COMMAND_PERMISSIONS_UPDATE: routeAs.command,
    AUTO_MODERATION_RULE_CREATE: routeAs.automod,
    AUTO_MODERATION_RULE_UPDATE: routeAs.automod,
    AUTO_MODERATION_RULE_DELETE: routeAs.automod,
    AUTO_MODERATION_ACTION_EXECUTION: routeAs.none,
    CHANNEL_CREATE: routeAs.channel,
    CHANNEL_UPDATE: routeAs.channel,
    CHANNEL_DELETE: routeAs.channel,
    CHANNEL_PINS_UPDATE: routeAs.none,
    CHANNEL_INFO: routeAs.none,
    VOICE_CHANNEL_STATUS_UPDATE: routeAs.channel,
    VOICE_CHANNEL_START_TIME_UPDATE: routeAs.channel,
    THREAD_CREATE: routeAs.channel,
    THREAD_UPDATE: routeAs.channel,
    THREAD_DELETE: routeAs.channel,
    THREAD_LIST_SYNC: routeAs.none,
    THREAD_MEMBER_UPDATE: routeAs.channel,
    THREAD_MEMBERS_UPDATE: routeAs.channel,
    GUILD_AUDIT_LOG_ENTRY_CREATE: routeAs.audit,
    GUILD_CREATE: routeAs.guild,
    GUILD_UPDATE: routeAs.guild,
    GUILD_DELETE: routeAs.guild,
    GUILD_BAN_ADD: routeAs.none,
    GUILD_BAN_REMOVE: routeAs.none,
    GUILD_EMOJIS_UPDATE: routeAs.none,
    GUILD_STICKERS_UPDATE: routeAs.none,
    GUILD_INTEGRATIONS_UPDATE: routeAs.none,
    GUILD_MEMBER_ADD: routeAs.none,
    GUILD_MEMBER_REMOVE: routeAs.none,
    GUILD_MEMBER_UPDATE: routeAs.none,
    GUILD_MEMBERS_CHUNK: routeAs.none,
    GUILD_ROLE_CREATE: routeAs.none,
    GUILD_ROLE_UPDATE: routeAs.none,
    GUILD_ROLE_DELETE: routeAs.none,
    GUILD_SCHEDULED_EVENT_CREATE: routeAs.event,
    GUILD_SCHEDULED_EVENT_UPDATE: routeAs.event,
    GUILD_SCHEDULED_EVENT_DELETE: routeAs.event,
    GUILD_SCHEDULED_EVENT_USER_ADD: routeAs.none,
    GUILD_SCHEDULED_EVENT_USER_REMOVE: routeAs.none,
    SOUNDBOARD_SOUNDS: routeAs.none,
    GUILD_SOUNDBOARD_SOUND_CREATE: routeAs.none,
    GUILD_SOUNDBOARD_SOUND_UPDATE: routeAs.none,
    GUILD_SOUNDBOARD_SOUND_DELETE: routeAs.none,
    GUILD_SOUNDBOARD_SOUNDS_UPDATE: routeAs.none,
    INTEGRATION_CREATE: routeAs.integration,
    INTEGRATION_UPDATE: routeAs.integration,
    INTEGRATION_DELETE: routeAs.integration,
    INTERACTION_CREATE: routeAs.interaction,
    INVITE_CREATE: routeAs.none,
    INVITE_DELETE: routeAs.none,
    MESSAGE_CREATE: routeAs.message,
    MESSAGE_UPDATE: routeAs.message,
    MESSAGE_DELETE: routeAs.message,
    MESSAGE_DELETE_BULK: routeAs.none,
    MESSAGE_REACTION_ADD: routeAs.none,
    MESSAGE_REACTION_REMOVE: routeAs.none,
    MESSAGE_REACTION_REMOVE_ALL: routeAs.none,
    MESSAGE_REACTION_REMOVE_EMOJI: routeAs.none,
    PRESENCE_UPDATE: routeAs.none,
    STAGE_INSTANCE_CREATE: routeAs.stage,
    STAGE_INSTANCE_UPDATE: routeAs.stage,
    STAGE_INSTANCE_DELETE: routeAs.stage,
    TYPING_START: routeAs.none,
    USER_UPDATE: routeAs.user,
    VOICE_CHANNEL_EFFECT_SEND: routeAs.none,
    VOICE_STATE_UPDATE: routeAs.none,
    VOICE_SERVER_UPDATE: routeAs.none,
    ENTITLEMENT_CREATE: routeAs.entitlement,
    ENTITLEMENT_UPDATE: routeAs.entitlement,
    ENTITLEMENT_DELETE: routeAs.entitlement,
    SUBSCRIPTION_CREATE: routeAs.subscription,
    SUBSCRIPTION_UPDATE: routeAs.subscription,
    SUBSCRIPTION_DELETE: routeAs.subscription,
    MESSAGE_POLL_VOTE_ADD: routeAs.none,
    MESSAGE_POLL_VOTE_REMOVE: routeAs.none,
    WEBHOOKS_UPDATE: routeAs.none
};
