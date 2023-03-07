import Discord from '@blargbot/discord-types';
import type { MessageHandle, MessageHub } from '@blargbot/message-hub';
import { blobToJson } from '@blargbot/message-hub';

import type { DiscordGatewayMessage } from './DiscordGatewayMessage.js';
import type { DispatchHandler, DispatchHandlerArgs, DispatchHandlerName, DispatchMap } from './dispatch.js';
import type { OpCodeHandler, OpCodeHandlerArgs, OpCodeHandlerName, ReceiveOpCodeMap } from './opCode.js';
import { nameToOpCodeMap } from './opCode.js';

export type PartialDiscordGatewayMessageBroker<Events extends keyof DispatchMap | keyof ReceiveOpCodeMap> =
    & { [P in Extract<Events, keyof DispatchMap> as DispatchHandlerName<P>]: DispatchHandler<P>; }
    & { [P in Extract<Events, keyof ReceiveOpCodeMap> as OpCodeHandlerName<P>]: OpCodeHandler<P>; }

export class DiscordGatewayMessageBroker implements PartialDiscordGatewayMessageBroker<keyof DispatchMap | keyof ReceiveOpCodeMap> {
    public static readonly eventExchange = Object.freeze([
        'discord-gateway-events',
        'topic',
        Object.freeze({ durable: true })
    ] as const);

    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(c => c.assertExchange(...DiscordGatewayMessageBroker.eventExchange));
    }

    async #handleOpCode<OpCode extends keyof ReceiveOpCodeMap>(event: OpCode, ...[handler, options]: OpCodeHandlerArgs<OpCode>): Promise<MessageHandle> {
        const { shard, ...amqpOptions } = options ?? {};
        const shardFilter = shard === undefined ? '*' : shard.join('/');
        const opCode = nameToOpCodeMap[event];
        return await this.#messages.handleMessage({
            ...amqpOptions,
            exchange: DiscordGatewayMessageBroker.eventExchange[0],
            queue: `${event}[${this.#serviceName}]`,
            filter: `${shardFilter}.${opCode}.*`,
            handle: async (data, msg) => {
                const { payload, shard, lastShard } = await blobToJson<DiscordGatewayMessage<ReceiveOpCodeMap[OpCode]>>(data);
                await handler(payload.d, [shard, lastShard], payload, msg);
            }
        });
    }

    async #handleDispatch<Dispatch extends keyof DispatchMap>(event: Dispatch, ...[handler, options]: DispatchHandlerArgs<Dispatch>): Promise<MessageHandle> {
        const { shard, ...amqpOptions } = options ?? {};
        const shardFilter = shard === undefined ? '*' : shard.join('/');
        return await this.#messages.handleMessage({
            ...amqpOptions,
            exchange: DiscordGatewayMessageBroker.eventExchange[0],
            queue: `${event}[${this.#serviceName}]`,
            filter: `${shardFilter}.${Discord.GatewayOpcodes.Dispatch}.${event}`,
            handle: async (data, msg) => {
                const { payload, shard, lastShard } = await blobToJson<DiscordGatewayMessage<DispatchMap[Dispatch]>>(data);
                await handler(payload.d, [shard, lastShard], payload, msg);
            }
        });
    }

    public async handleDispatch(...args: OpCodeHandlerArgs<'DISPATCH'>): Promise<MessageHandle> {
        return await this.#handleOpCode('DISPATCH', ...args);
    }
    public async handleHeartbeat(...args: OpCodeHandlerArgs<'HEARTBEAT'>): Promise<MessageHandle> {
        return await this.#handleOpCode('HEARTBEAT', ...args);
    }
    public async handleHeartbeatAck(...args: OpCodeHandlerArgs<'HEARTBEAT_ACK'>): Promise<MessageHandle> {
        return await this.#handleOpCode('HEARTBEAT_ACK', ...args);
    }
    public async handleHello(...args: OpCodeHandlerArgs<'HELLO'>): Promise<MessageHandle> {
        return await this.#handleOpCode('HELLO', ...args);
    }
    public async handleInvalidSession(...args: OpCodeHandlerArgs<'INVALID_SESSION'>): Promise<MessageHandle> {
        return await this.#handleOpCode('INVALID_SESSION', ...args);
    }
    public async handleReconnect(...args: OpCodeHandlerArgs<'RECONNECT'>): Promise<MessageHandle> {
        return await this.#handleOpCode('RECONNECT', ...args);
    }
    public async handleAutoModerationRuleCreate(...args: DispatchHandlerArgs<'AUTO_MODERATION_RULE_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('AUTO_MODERATION_RULE_CREATE', ...args);
    }
    public async handleAutoModerationRuleUpdate(...args: DispatchHandlerArgs<'AUTO_MODERATION_RULE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('AUTO_MODERATION_RULE_UPDATE', ...args);
    }
    public async handleAutoModerationRuleDelete(...args: DispatchHandlerArgs<'AUTO_MODERATION_RULE_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('AUTO_MODERATION_RULE_DELETE', ...args);
    }
    public async handleAutoModerationActionExecution(...args: DispatchHandlerArgs<'AUTO_MODERATION_ACTION_EXECUTION'>): Promise<MessageHandle> {
        return await this.#handleDispatch('AUTO_MODERATION_ACTION_EXECUTION', ...args);
    }
    public async handleApplicationCommandPermissionsUpdate(...args: DispatchHandlerArgs<'APPLICATION_COMMAND_PERMISSIONS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('APPLICATION_COMMAND_PERMISSIONS_UPDATE', ...args);
    }
    public async handleChannelCreate(...args: DispatchHandlerArgs<'CHANNEL_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('CHANNEL_CREATE', ...args);
    }
    public async handleChannelDelete(...args: DispatchHandlerArgs<'CHANNEL_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('CHANNEL_DELETE', ...args);
    }
    public async handleChannelUpdate(...args: DispatchHandlerArgs<'CHANNEL_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('CHANNEL_UPDATE', ...args);
    }
    public async handleChannelPinsUpdate(...args: DispatchHandlerArgs<'CHANNEL_PINS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('CHANNEL_PINS_UPDATE', ...args);
    }
    public async handleGuildBanAdd(...args: DispatchHandlerArgs<'GUILD_BAN_ADD'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_BAN_ADD', ...args);
    }
    public async handleGuildBanRemove(...args: DispatchHandlerArgs<'GUILD_BAN_REMOVE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_BAN_REMOVE', ...args);
    }
    public async handleGuildCreate(...args: DispatchHandlerArgs<'GUILD_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_CREATE', ...args);
    }
    public async handleGuildDelete(...args: DispatchHandlerArgs<'GUILD_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_DELETE', ...args);
    }
    public async handleGuildEmojisUpdate(...args: DispatchHandlerArgs<'GUILD_EMOJIS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_EMOJIS_UPDATE', ...args);
    }
    public async handleGuildIntegrationsUpdate(...args: DispatchHandlerArgs<'GUILD_INTEGRATIONS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_INTEGRATIONS_UPDATE', ...args);
    }
    public async handleGuildMemberAdd(...args: DispatchHandlerArgs<'GUILD_MEMBER_ADD'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_MEMBER_ADD', ...args);
    }
    public async handleGuildMemberRemove(...args: DispatchHandlerArgs<'GUILD_MEMBER_REMOVE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_MEMBER_REMOVE', ...args);
    }
    public async handleGuildMembersChunk(...args: DispatchHandlerArgs<'GUILD_MEMBERS_CHUNK'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_MEMBERS_CHUNK', ...args);
    }
    public async handleGuildMemberUpdate(...args: DispatchHandlerArgs<'GUILD_MEMBER_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_MEMBER_UPDATE', ...args);
    }
    public async handleGuildUpdate(...args: DispatchHandlerArgs<'GUILD_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_UPDATE', ...args);
    }
    public async handleGuildRoleDelete(...args: DispatchHandlerArgs<'GUILD_ROLE_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_ROLE_DELETE', ...args);
    }
    public async handleGuildRoleCreate(...args: DispatchHandlerArgs<'GUILD_ROLE_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_ROLE_CREATE', ...args);
    }
    public async handleGuildRoleUpdate(...args: DispatchHandlerArgs<'GUILD_ROLE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_ROLE_UPDATE', ...args);
    }
    public async handleGuildScheduledEventCreate(...args: DispatchHandlerArgs<'GUILD_SCHEDULED_EVENT_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_SCHEDULED_EVENT_CREATE', ...args);
    }
    public async handleGuildScheduledEventUpdate(...args: DispatchHandlerArgs<'GUILD_SCHEDULED_EVENT_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_SCHEDULED_EVENT_UPDATE', ...args);
    }
    public async handleGuildScheduledEventDelete(...args: DispatchHandlerArgs<'GUILD_SCHEDULED_EVENT_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_SCHEDULED_EVENT_DELETE', ...args);
    }
    public async handleGuildScheduledEventUserAdd(...args: DispatchHandlerArgs<'GUILD_SCHEDULED_EVENT_USER_ADD'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_SCHEDULED_EVENT_USER_ADD', ...args);
    }
    public async handleGuildScheduledEventUserRemove(...args: DispatchHandlerArgs<'GUILD_SCHEDULED_EVENT_USER_REMOVE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_SCHEDULED_EVENT_USER_REMOVE', ...args);
    }
    public async handleGuildStickersUpdate(...args: DispatchHandlerArgs<'GUILD_STICKERS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_STICKERS_UPDATE', ...args);
    }
    public async handleIntegrationCreate(...args: DispatchHandlerArgs<'INTEGRATION_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('INTEGRATION_CREATE', ...args);
    }
    public async handleIntegrationDelete(...args: DispatchHandlerArgs<'INTEGRATION_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('INTEGRATION_DELETE', ...args);
    }
    public async handleIntegrationUpdate(...args: DispatchHandlerArgs<'INTEGRATION_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('INTEGRATION_UPDATE', ...args);
    }
    public async handleInteractionCreate(...args: DispatchHandlerArgs<'INTERACTION_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('INTERACTION_CREATE', ...args);
    }
    public async handleInviteCreate(...args: DispatchHandlerArgs<'INVITE_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('INVITE_CREATE', ...args);
    }
    public async handleInviteDelete(...args: DispatchHandlerArgs<'INVITE_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('INVITE_DELETE', ...args);
    }
    public async handleMessageCreate(...args: DispatchHandlerArgs<'MESSAGE_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('MESSAGE_CREATE', ...args);
    }
    public async handleMessageDeleteBulk(...args: DispatchHandlerArgs<'MESSAGE_DELETE_BULK'>): Promise<MessageHandle> {
        return await this.#handleDispatch('MESSAGE_DELETE_BULK', ...args);
    }
    public async handleMessageDelete(...args: DispatchHandlerArgs<'MESSAGE_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('MESSAGE_DELETE', ...args);
    }
    public async handleMessageReactionAdd(...args: DispatchHandlerArgs<'MESSAGE_REACTION_ADD'>): Promise<MessageHandle> {
        return await this.#handleDispatch('MESSAGE_REACTION_ADD', ...args);
    }
    public async handleMessageReactionRemoveAll(...args: DispatchHandlerArgs<'MESSAGE_REACTION_REMOVE_ALL'>): Promise<MessageHandle> {
        return await this.#handleDispatch('MESSAGE_REACTION_REMOVE_ALL', ...args);
    }
    public async handleMessageReactionRemove(...args: DispatchHandlerArgs<'MESSAGE_REACTION_REMOVE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('MESSAGE_REACTION_REMOVE', ...args);
    }
    public async handleMessageReactionRemoveEmoji(...args: DispatchHandlerArgs<'MESSAGE_REACTION_REMOVE_EMOJI'>): Promise<MessageHandle> {
        return await this.#handleDispatch('MESSAGE_REACTION_REMOVE_EMOJI', ...args);
    }
    public async handleMessageUpdate(...args: DispatchHandlerArgs<'MESSAGE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('MESSAGE_UPDATE', ...args);
    }
    public async handlePresenceUpdate(...args: DispatchHandlerArgs<'PRESENCE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('PRESENCE_UPDATE', ...args);
    }
    public async handleStageInstanceCreate(...args: DispatchHandlerArgs<'STAGE_INSTANCE_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('STAGE_INSTANCE_CREATE', ...args);
    }
    public async handleStageInstanceDelete(...args: DispatchHandlerArgs<'STAGE_INSTANCE_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('STAGE_INSTANCE_DELETE', ...args);
    }
    public async handleStageInstanceUpdate(...args: DispatchHandlerArgs<'STAGE_INSTANCE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('STAGE_INSTANCE_UPDATE', ...args);
    }
    public async handleReady(...args: DispatchHandlerArgs<'READY'>): Promise<MessageHandle> {
        return await this.#handleDispatch('READY', ...args);
    }
    public async handleResumed(...args: DispatchHandlerArgs<'RESUMED'>): Promise<MessageHandle> {
        return await this.#handleDispatch('RESUMED', ...args);
    }
    public async handleThreadListSync(...args: DispatchHandlerArgs<'THREAD_LIST_SYNC'>): Promise<MessageHandle> {
        return await this.#handleDispatch('THREAD_LIST_SYNC', ...args);
    }
    public async handleThreadMembersUpdate(...args: DispatchHandlerArgs<'THREAD_MEMBERS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('THREAD_MEMBERS_UPDATE', ...args);
    }
    public async handleThreadMemberUpdate(...args: DispatchHandlerArgs<'THREAD_MEMBER_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('THREAD_MEMBER_UPDATE', ...args);
    }
    public async handleThreadCreate(...args: DispatchHandlerArgs<'THREAD_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('THREAD_CREATE', ...args);
    }
    public async handleThreadDelete(...args: DispatchHandlerArgs<'THREAD_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('THREAD_DELETE', ...args);
    }
    public async handleThreadUpdate(...args: DispatchHandlerArgs<'THREAD_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('THREAD_UPDATE', ...args);
    }
    public async handleTypingStart(...args: DispatchHandlerArgs<'TYPING_START'>): Promise<MessageHandle> {
        return await this.#handleDispatch('TYPING_START', ...args);
    }
    public async handleUserUpdate(...args: DispatchHandlerArgs<'USER_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('USER_UPDATE', ...args);
    }
    public async handleVoiceServerUpdate(...args: DispatchHandlerArgs<'VOICE_SERVER_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('VOICE_SERVER_UPDATE', ...args);
    }
    public async handleVoiceStateUpdate(...args: DispatchHandlerArgs<'VOICE_STATE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('VOICE_STATE_UPDATE', ...args);
    }
    public async handleWebhooksUpdate(...args: DispatchHandlerArgs<'WEBHOOKS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('WEBHOOKS_UPDATE', ...args);
    }
    public async handleGuildAuditLogEntryCreate(...args: DispatchHandlerArgs<'GUILD_AUDIT_LOG_ENTRY_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatch('GUILD_AUDIT_LOG_ENTRY_CREATE', ...args);
    }
}
