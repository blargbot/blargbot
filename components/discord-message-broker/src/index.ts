import type { ConsumeMessage, HandleMessageOptions, MessageHandle } from '@blargbot/message-broker';
import type MessageBroker from '@blargbot/message-broker';
import type amqplib from 'amqplib';
import * as discordeno from 'discordeno';

export interface DiscordMessageBrokerMixinType<
    Events extends readonly discordeno.GatewayDispatchEventNames[],
    Type extends abstract new (...args: never) => MessageBroker
> {
    new(...args: ConstructorParameters<Type>): DiscordMessageBrokerMixin<Events, Type>;
}

export interface DiscordMessageBrokerMixinOptions<
    Events extends readonly discordeno.GatewayDispatchEventNames[],
    Type extends abstract new (...args: never) => MessageBroker
> {
    readonly type: Type;
    readonly events: Events;
    readonly serviceName: string;
    readonly eventExchange: string;
}

export type DiscordMessageBrokerMixin<Events extends readonly discordeno.GatewayDispatchEventNames[], Type extends abstract new (...args: never) => MessageBroker> = InstanceType<Type> & {
    [P in Events[number]as `handle${SnakeCaseToPascalCase<P>}`]: HandleMessageFunction<P, InstanceType<Type>>
}

export function discordMessageBrokerMixin<
    Events extends [] | readonly discordeno.GatewayDispatchEventNames[],
    Type extends abstract new (...args: never) => Instance,
    Instance extends MessageBroker
>(options: DiscordMessageBrokerMixinOptions<Events, Type>): DiscordMessageBrokerMixinType<Events, Type> {
    const { type, eventExchange, serviceName } = options;
    // @ts-expect-error Not sure why I must provide a constructor definition?
    class DiscordMessageBrokerMixin extends type {
        public override async onceConnected(channel: amqplib.Channel): Promise<void> {
            await channel.assertExchange(eventExchange, 'topic', { durable: true });
        }
    }

    for (const event of options.events) {
        const handlerName = `handle${snakeCaseToPascalCase(event)}`;
        Object.defineProperty(DiscordMessageBrokerMixin.prototype, handlerName, {
            value: async function (this: Instance, handler: (message: DispatchEventTypeConfig[typeof event], msg: ConsumeMessage) => Awaitable<void>, options?: HandleGatewayEventOptions<Instance>): Promise<MessageHandle> {
                return await this.handleMessage({
                    ...options,
                    exchange: eventExchange,
                    queue: `${event}[${serviceName}]`,
                    filter: `*.${discordeno.GatewayOpcodes.Dispatch}.${event}`,
                    handle: async (data, msg) => {
                        const message = await this.blobToJson<{ event: { d: DispatchEventTypeConfig[typeof event]; }; }>(data);
                        await handler(message.event.d, msg);
                    }
                });
            }
        });
    }

    return DiscordMessageBrokerMixin as unknown as DiscordMessageBrokerMixinType<Events, Type>;
}

type HandleGatewayEventOptions<This> = Omit<HandleMessageOptions<This>, 'queue' | 'exchange' | 'filter' | 'handle'>;

interface HandleMessageFunction<Event extends discordeno.GatewayDispatchEventNames, This> {
    (this: This, handler: (message: DispatchEventTypeConfig[Event], msg: ConsumeMessage) => Awaitable<void>, options?: HandleGatewayEventOptions<This>): Promise<MessageHandle>;
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

function snakeCaseToPascalCase<Input extends string>(input: Input): SnakeCaseToPascalCase<Input>
function snakeCaseToPascalCase(input: string): string {
    return input.toLowerCase().split('_').map(x => `${x.slice(0, 1).toUpperCase()}${x.slice(1)}`).join('');
}
