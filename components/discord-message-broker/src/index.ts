import type { ConsumeMessage, MessageHandle } from '@blargbot/message-broker';
import type MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import * as discordeno from 'discordeno';

export interface DiscordMessageBrokerMixinType<
    Events extends discordeno.GatewayDispatchEventNames,
    Args extends readonly unknown[],
    Type extends MessageBroker
> {
    new(eventExchange: string, serviceName: string, ...args: Args): Type & DiscordMessageBrokerMixin<Events>;
}

export type DiscordMessageBrokerMixin<Events extends discordeno.GatewayDispatchEventNames> = {
    [P in Events as DispatchEventRuntimeConfig[P]]: (handler: (message: DispatchEventTypeConfig[P], msg: ConsumeMessage) => Awaitable<void>) => Promise<MessageHandle>
}

export function discordMessageBrokerMixin<
    Events extends discordeno.GatewayDispatchEventNames,
    Args extends readonly unknown[],
    Type extends MessageBroker
>(type: abstract new (...args: Args) => Type, ...events: Events[]): DiscordMessageBrokerMixinType<Events, Args, Type>
export function discordMessageBrokerMixin<
    Events extends discordeno.GatewayDispatchEventNames,
    Args extends readonly unknown[]
>(type: abstract new (...args: Args) => MessageBroker, ...events: Events[]): DiscordMessageBrokerMixinType<Events, Args, MessageBroker> {
    const result = class extends type {
        readonly #serviceName: string;
        readonly #eventExchange: string;
        readonly [x: string]: unknown;

        public constructor(eventExchange: string, serviceName: string, ...args: Args) {
            super(...args);
            this.#eventExchange = eventExchange;
            this.#serviceName = serviceName;

            for (const event of events) {
                const handler = dispatchEventNameConfig[event];
                //@ts-expect-error Not sure why its complaining here, the index signature is defined as unknown
                this[handler] = {
                    async[handler](this: InstanceType<typeof result>, handler: (message: unknown, msg: ConsumeMessage) => Awaitable<void>): Promise<MessageHandle> {
                        return await this.handleMessage({
                            exchange: this.#eventExchange,
                            queue: `${event}[${this.#serviceName}]`,
                            filter: `*.${discordeno.GatewayOpcodes.Dispatch}.${event}`,
                            async handle(data, msg) {
                                const message = await this.blobToJson<{ event: { d: unknown; }; }>(data);
                                await handler(message.event.d, msg);
                            }
                        });
                    }
                }[handler].bind(this);
            }
        }

        public override async onceConnected(channel: amqplib.Channel): Promise<void> {
            await channel.assertExchange(this.#eventExchange, 'topic', { durable: true });
        }
    };

    return result as unknown as DiscordMessageBrokerMixinType<Events, Args, MessageBroker>;
}

type DispatchEventRuntimeConfig = {
    [P in discordeno.GatewayDispatchEventNames]: `handle${SnakeCaseToPascalCase<P>}`;
}

type DispatchEventTypeConfig = VerifyAllEventsAreSet<{
    ['READY']: discordeno.DiscordReady;
    ['CHANNEL_CREATE']: discordeno.DiscordChannel;
    ['CHANNEL_DELETE']: discordeno.DiscordChannel;
    ['CHANNEL_PINS_UPDATE']: discordeno.DiscordChannelPinsUpdate;
    ['CHANNEL_UPDATE']: discordeno.DiscordChannel;
    ['GUILD_AUDIT_LOG_ENTRY_CREATE']: discordeno.DiscordAuditLogEntry;
    ['GUILD_BAN_ADD']: discordeno.DiscordGuildBanAddRemove;
    ['GUILD_BAN_REMOVE']: discordeno.DiscordGuildBanAddRemove;
    ['GUILD_CREATE']: discordeno.DiscordGuild;
    ['GUILD_DELETE']: discordeno.DiscordUnavailableGuild;
    ['GUILD_EMOJIS_UPDATE']: discordeno.DiscordGuildEmojisUpdate;
    ['GUILD_INTEGRATIONS_UPDATE']: discordeno.DiscordIntegrationCreateUpdate;
    ['GUILD_MEMBER_ADD']: discordeno.DiscordGuildMemberAdd;
    ['GUILD_MEMBER_REMOVE']: discordeno.DiscordGuildMemberRemove;
    ['GUILD_MEMBER_UPDATE']: discordeno.DiscordGuildMemberUpdate;
    ['GUILD_MEMBERS_CHUNK']: discordeno.DiscordGuildMembersChunk;
    ['GUILD_ROLE_CREATE']: discordeno.DiscordGuildRoleCreate;
    ['GUILD_ROLE_DELETE']: discordeno.DiscordGuildRoleDelete;
    ['GUILD_ROLE_UPDATE']: discordeno.DiscordGuildRoleUpdate;
    ['GUILD_UPDATE']: discordeno.DiscordGuild;
    ['GUILD_SCHEDULED_EVENT_CREATE']: discordeno.DiscordScheduledEvent;
    ['GUILD_SCHEDULED_EVENT_DELETE']: discordeno.DiscordScheduledEvent;
    ['GUILD_SCHEDULED_EVENT_UPDATE']: discordeno.DiscordScheduledEvent;
    ['GUILD_SCHEDULED_EVENT_USER_ADD']: discordeno.DiscordScheduledEventUserAdd;
    ['GUILD_SCHEDULED_EVENT_USER_REMOVE']: discordeno.DiscordScheduledEventUserRemove;
    ['INTERACTION_CREATE']: discordeno.DiscordInteraction;
    ['INVITE_CREATE']: discordeno.DiscordInviteCreate;
    ['INVITE_DELETE']: discordeno.DiscordInviteDelete;
    ['MESSAGE_CREATE']: discordeno.DiscordMessage;
    ['MESSAGE_DELETE_BULK']: discordeno.DiscordMessageDeleteBulk;
    ['MESSAGE_DELETE']: discordeno.DiscordMessageDelete;
    ['MESSAGE_REACTION_ADD']: discordeno.DiscordMessageReactionAdd;
    ['MESSAGE_REACTION_REMOVE_ALL']: discordeno.DiscordMessageReactionRemoveAll;
    ['MESSAGE_REACTION_REMOVE_EMOJI']: discordeno.DiscordMessageReactionRemoveEmoji;
    ['MESSAGE_REACTION_REMOVE']: discordeno.DiscordMessageReactionRemove;
    ['MESSAGE_UPDATE']: discordeno.DiscordMessage;
    ['PRESENCE_UPDATE']: discordeno.DiscordPresenceUpdate;
    ['TYPING_START']: discordeno.DiscordTypingStart;
    ['USER_UPDATE']: discordeno.DiscordUser;
    ['VOICE_SERVER_UPDATE']: discordeno.DiscordVoiceServerUpdate;
    ['VOICE_STATE_UPDATE']: discordeno.DiscordVoiceState;
    ['WEBHOOKS_UPDATE']: discordeno.DiscordWebhookUpdate;
    ['INTEGRATION_CREATE']: discordeno.DiscordIntegrationCreateUpdate;
    ['INTEGRATION_UPDATE']: discordeno.DiscordIntegrationCreateUpdate;
    ['INTEGRATION_DELETE']: discordeno.DiscordIntegrationDelete;
    ['STAGE_INSTANCE_CREATE']: discordeno.DiscordStageInstance;
    ['STAGE_INSTANCE_UPDATE']: discordeno.DiscordStageInstance;
    ['STAGE_INSTANCE_DELETE']: discordeno.DiscordStageInstance;
    ['THREAD_CREATE']: discordeno.DiscordChannel;
    ['THREAD_UPDATE']: discordeno.DiscordChannel;
    ['THREAD_DELETE']: discordeno.DiscordChannel;
    ['THREAD_LIST_SYNC']: discordeno.DiscordThreadListSync;
    ['THREAD_MEMBERS_UPDATE']: discordeno.DiscordThreadMembersUpdate;
}>

type VerifyAllEventsAreSet<X extends { [P in discordeno.GatewayDispatchEventNames]: unknown }> = X;

type SnakeCaseToPascalCase<Input extends string> =
    Input extends `${infer A}_${infer B}`
    ? `${UppercaseFirst<Lowercase<A>>}${SnakeCaseToPascalCase<B>}`
    : UppercaseFirst<Lowercase<Input>>

const dispatchEventNameConfig: DispatchEventRuntimeConfig = {
    READY: 'handleReady',
    CHANNEL_CREATE: 'handleChannelCreate',
    CHANNEL_DELETE: 'handleChannelDelete',
    CHANNEL_PINS_UPDATE: 'handleChannelPinsUpdate',
    CHANNEL_UPDATE: 'handleChannelUpdate',
    GUILD_AUDIT_LOG_ENTRY_CREATE: 'handleGuildAuditLogEntryCreate',
    GUILD_BAN_ADD: 'handleGuildBanAdd',
    GUILD_BAN_REMOVE: 'handleGuildBanRemove',
    GUILD_CREATE: 'handleGuildCreate',
    GUILD_DELETE: 'handleGuildDelete',
    GUILD_EMOJIS_UPDATE: 'handleGuildEmojisUpdate',
    GUILD_INTEGRATIONS_UPDATE: 'handleGuildIntegrationsUpdate',
    GUILD_MEMBER_ADD: 'handleGuildMemberAdd',
    GUILD_MEMBER_REMOVE: 'handleGuildMemberRemove',
    GUILD_MEMBER_UPDATE: 'handleGuildMemberUpdate',
    GUILD_MEMBERS_CHUNK: 'handleGuildMembersChunk',
    GUILD_ROLE_CREATE: 'handleGuildRoleCreate',
    GUILD_ROLE_DELETE: 'handleGuildRoleDelete',
    GUILD_ROLE_UPDATE: 'handleGuildRoleUpdate',
    GUILD_UPDATE: 'handleGuildUpdate',
    GUILD_SCHEDULED_EVENT_CREATE: 'handleGuildScheduledEventCreate',
    GUILD_SCHEDULED_EVENT_DELETE: 'handleGuildScheduledEventDelete',
    GUILD_SCHEDULED_EVENT_UPDATE: 'handleGuildScheduledEventUpdate',
    GUILD_SCHEDULED_EVENT_USER_ADD: 'handleGuildScheduledEventUserAdd',
    GUILD_SCHEDULED_EVENT_USER_REMOVE: 'handleGuildScheduledEventUserRemove',
    INTERACTION_CREATE: 'handleInteractionCreate',
    INVITE_CREATE: 'handleInviteCreate',
    INVITE_DELETE: 'handleInviteDelete',
    MESSAGE_CREATE: 'handleMessageCreate',
    MESSAGE_DELETE_BULK: 'handleMessageDeleteBulk',
    MESSAGE_DELETE: 'handleMessageDelete',
    MESSAGE_REACTION_ADD: 'handleMessageReactionAdd',
    MESSAGE_REACTION_REMOVE_ALL: 'handleMessageReactionRemoveAll',
    MESSAGE_REACTION_REMOVE_EMOJI: 'handleMessageReactionRemoveEmoji',
    MESSAGE_REACTION_REMOVE: 'handleMessageReactionRemove',
    MESSAGE_UPDATE: 'handleMessageUpdate',
    PRESENCE_UPDATE: 'handlePresenceUpdate',
    TYPING_START: 'handleTypingStart',
    USER_UPDATE: 'handleUserUpdate',
    VOICE_SERVER_UPDATE: 'handleVoiceServerUpdate',
    VOICE_STATE_UPDATE: 'handleVoiceStateUpdate',
    WEBHOOKS_UPDATE: 'handleWebhooksUpdate',
    INTEGRATION_CREATE: 'handleIntegrationCreate',
    INTEGRATION_UPDATE: 'handleIntegrationUpdate',
    INTEGRATION_DELETE: 'handleIntegrationDelete',
    STAGE_INSTANCE_CREATE: 'handleStageInstanceCreate',
    STAGE_INSTANCE_UPDATE: 'handleStageInstanceUpdate',
    STAGE_INSTANCE_DELETE: 'handleStageInstanceDelete',
    THREAD_CREATE: 'handleThreadCreate',
    THREAD_UPDATE: 'handleThreadUpdate',
    THREAD_DELETE: 'handleThreadDelete',
    THREAD_LIST_SYNC: 'handleThreadListSync',
    THREAD_MEMBERS_UPDATE: 'handleThreadMembersUpdate'
};
