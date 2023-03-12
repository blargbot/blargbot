import { createHash } from 'node:crypto';

import Discord from '@blargbot/discord-types';
import type { MessageHandle, MessageHub } from '@blargbot/message-hub';
import { blobToJson, jsonToBlob } from '@blargbot/message-hub';

import type { DiscordGatewayMessage } from './DiscordGatewayMessage.js';
import type { DispatchHandler, DispatchHandlerArgs, DispatchHandlerName, DispatchMap } from './dispatch.js';
import type { OpCodeHandler, OpCodeHandlerArgs, OpCodeHandlerName, OpCodeMap, ReceiveOpCode, SendOpCode } from './opCode.js';
import { nameToOpCodeMap, receiveOpCodes, sendOpCodes } from './opCode.js';

export type PartialDiscordGatewayMessageBroker<Events extends keyof DispatchMap | keyof OpCodeMap> =
    & { [P in Extract<Events, keyof DispatchMap> as DispatchHandlerName<P>]: DispatchHandler<P>; }
    & { [P in Extract<Events, keyof OpCodeMap> as OpCodeHandlerName<P>]: OpCodeHandler<P>; }

const eventExchange = 'discord-gateway-events';
const dedupeExchange = 'discord-gateway-events-dedupe';
export class DiscordGatewayMessageBroker implements PartialDiscordGatewayMessageBroker<keyof DispatchMap | keyof OpCodeMap> {
    readonly #messages: MessageHub;
    readonly #serviceName: string;

    public constructor(messages: MessageHub, serviceName: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;

        this.#messages.onConnected(async c => {
            await Promise.all([
                c.assertExchange(eventExchange, 'topic', { durable: true }),
                c.assertExchange(dedupeExchange, 'x-message-deduplication', {
                    durable: true,
                    arguments: {
                        'x-cache-size': 1000,
                        'x-cache-ttl': 500
                    }
                })
            ]);
            await c.bindExchange(eventExchange, dedupeExchange, '#');
        });
    }

    async #handleOpCodes<OpCode extends keyof OpCodeMap>(name: string, events: readonly OpCode[], ...[handler, options]: OpCodeHandlerArgs<OpCode>): Promise<MessageHandle> {
        const { shard, ...amqpOptions } = options ?? {};
        const shardFilter = shard === undefined ? '*' : shard.join('/');
        const opCodes = events.map(e => nameToOpCodeMap[e]);
        return await this.#messages.handleMessage({
            ...amqpOptions,
            exchange: eventExchange,
            queue: `${name}[${this.#serviceName}]`,
            filter: opCodes.map(c => `${shardFilter}.${c}.*`),
            handle: async (data, msg) => {
                const { payload, shard, lastShard } = await blobToJson<DiscordGatewayMessage<OpCodeMap[OpCode]>>(data);
                await handler(payload.d, [shard, lastShard], payload, msg);
            }
        });
    }

    async #handleDispatches<Dispatch extends keyof DispatchMap>(name: string, events: Dispatch[], ...[handler, options]: DispatchHandlerArgs<Dispatch>): Promise<MessageHandle> {
        const { shard, ...amqpOptions } = options ?? {};
        const shardFilter = shard === undefined ? '*' : shard.join('/');
        return await this.#messages.handleMessage({
            ...amqpOptions,
            exchange: eventExchange,
            queue: `${name}[${this.#serviceName}]`,
            filter: events.map(e => `${shardFilter}.${Discord.GatewayOpcodes.Dispatch}.${e}`),
            handle: async (data, msg) => {
                const { payload, shard, lastShard } = await blobToJson<DiscordGatewayMessage<DispatchMap[Dispatch]>>(data);
                await handler(payload.d, [shard, lastShard], payload, msg);
            }
        });
    }

    public async pushMessage(shardId: number, lastShardId: number, payload: Discord.GatewayReceivePayload | Discord.GatewaySendPayload): Promise<void> {
        const message: DiscordGatewayMessage<Discord.GatewayReceivePayload | Discord.GatewaySendPayload> = {
            lastShard: lastShardId,
            payload: payload,
            shard: shardId
        };
        await this.#messages.publish(dedupeExchange, `${shardId}/${lastShardId}.${payload.op}.${'t' in payload ? payload.t ?? '-' : '-'}`, jsonToBlob(message), {
            headers: {
                'x-deduplication-header': createHash('md5').update(JSON.stringify(payload.d)).digest('hex')
            }
        });
    }

    public async handleSend(...args: OpCodeHandlerArgs<SendOpCode>): Promise<MessageHandle> {
        return await this.#handleOpCodes('SEND', sendOpCodes, ...args);
    }
    public async handleReceive(...args: OpCodeHandlerArgs<ReceiveOpCode>): Promise<MessageHandle> {
        return await this.#handleOpCodes('RECEIVE', receiveOpCodes, ...args);
    }
    public async handleDispatch(...args: OpCodeHandlerArgs<'DISPATCH'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('DISPATCH', ['DISPATCH'], ...args);
    }
    public async handleHeartbeat(...args: OpCodeHandlerArgs<'HEARTBEAT'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('HEARTBEAT', ['HEARTBEAT'], ...args);
    }
    public async handleHeartbeatAck(...args: OpCodeHandlerArgs<'HEARTBEAT_ACK'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('HEARTBEAT_ACK', ['HEARTBEAT_ACK'], ...args);
    }
    public async handleHello(...args: OpCodeHandlerArgs<'HELLO'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('HELLO', ['HELLO'], ...args);
    }
    public async handleInvalidSession(...args: OpCodeHandlerArgs<'INVALID_SESSION'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('INVALID_SESSION', ['INVALID_SESSION'], ...args);
    }
    public async handleReconnect(...args: OpCodeHandlerArgs<'RECONNECT'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('RECONNECT', ['RECONNECT'], ...args);
    }
    public async handleIdentify(...args: OpCodeHandlerArgs<'IDENTIFY'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('IDENTIFY', ['IDENTIFY'], ...args);
    }
    public async handleUpdatePresence(...args: OpCodeHandlerArgs<'UPDATE_PRESENCE'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('UPDATE_PRESENCE', ['UPDATE_PRESENCE'], ...args);
    }
    public async handleRequestGuildMembers(...args: OpCodeHandlerArgs<'REQUEST_GUILD_MEMBERS'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('REQUEST_GUILD_MEMBERS', ['REQUEST_GUILD_MEMBERS'], ...args);
    }
    public async handleResume(...args: OpCodeHandlerArgs<'RESUME'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('RESUME', ['RESUME'], ...args);
    }
    public async handleUpdateVoiceState(...args: OpCodeHandlerArgs<'UPDATE_VOICE_STATE'>): Promise<MessageHandle> {
        return await this.#handleOpCodes('UPDATE_VOICE_STATE', ['UPDATE_VOICE_STATE'], ...args);
    }
    public async handleAutoModerationRuleCreate(...args: DispatchHandlerArgs<'AUTO_MODERATION_RULE_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('AUTO_MODERATION_RULE_CREATE', ['AUTO_MODERATION_RULE_CREATE'], ...args);
    }
    public async handleAutoModerationRuleUpdate(...args: DispatchHandlerArgs<'AUTO_MODERATION_RULE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('AUTO_MODERATION_RULE_UPDATE', ['AUTO_MODERATION_RULE_UPDATE'], ...args);
    }
    public async handleAutoModerationRuleDelete(...args: DispatchHandlerArgs<'AUTO_MODERATION_RULE_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('AUTO_MODERATION_RULE_DELETE', ['AUTO_MODERATION_RULE_DELETE'], ...args);
    }
    public async handleAutoModerationActionExecution(...args: DispatchHandlerArgs<'AUTO_MODERATION_ACTION_EXECUTION'>): Promise<MessageHandle> {
        return await this.#handleDispatches('AUTO_MODERATION_ACTION_EXECUTION', ['AUTO_MODERATION_ACTION_EXECUTION'], ...args);
    }
    public async handleApplicationCommandPermissionsUpdate(...args: DispatchHandlerArgs<'APPLICATION_COMMAND_PERMISSIONS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('APPLICATION_COMMAND_PERMISSIONS_UPDATE', ['APPLICATION_COMMAND_PERMISSIONS_UPDATE'], ...args);
    }
    public async handleChannelCreate(...args: DispatchHandlerArgs<'CHANNEL_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('CHANNEL_CREATE', ['CHANNEL_CREATE'], ...args);
    }
    public async handleChannelDelete(...args: DispatchHandlerArgs<'CHANNEL_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('CHANNEL_DELETE', ['CHANNEL_DELETE'], ...args);
    }
    public async handleChannelUpdate(...args: DispatchHandlerArgs<'CHANNEL_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('CHANNEL_UPDATE', ['CHANNEL_UPDATE'], ...args);
    }
    public async handleChannelPinsUpdate(...args: DispatchHandlerArgs<'CHANNEL_PINS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('CHANNEL_PINS_UPDATE', ['CHANNEL_PINS_UPDATE'], ...args);
    }
    public async handleGuildBanAdd(...args: DispatchHandlerArgs<'GUILD_BAN_ADD'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_BAN_ADD', ['GUILD_BAN_ADD'], ...args);
    }
    public async handleGuildBanRemove(...args: DispatchHandlerArgs<'GUILD_BAN_REMOVE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_BAN_REMOVE', ['GUILD_BAN_REMOVE'], ...args);
    }
    public async handleGuildCreate(...args: DispatchHandlerArgs<'GUILD_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_CREATE', ['GUILD_CREATE'], ...args);
    }
    public async handleGuildDelete(...args: DispatchHandlerArgs<'GUILD_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_DELETE', ['GUILD_DELETE'], ...args);
    }
    public async handleGuildEmojisUpdate(...args: DispatchHandlerArgs<'GUILD_EMOJIS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_EMOJIS_UPDATE', ['GUILD_EMOJIS_UPDATE'], ...args);
    }
    public async handleGuildIntegrationsUpdate(...args: DispatchHandlerArgs<'GUILD_INTEGRATIONS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_INTEGRATIONS_UPDATE', ['GUILD_INTEGRATIONS_UPDATE'], ...args);
    }
    public async handleGuildMemberAdd(...args: DispatchHandlerArgs<'GUILD_MEMBER_ADD'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_MEMBER_ADD', ['GUILD_MEMBER_ADD'], ...args);
    }
    public async handleGuildMemberRemove(...args: DispatchHandlerArgs<'GUILD_MEMBER_REMOVE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_MEMBER_REMOVE', ['GUILD_MEMBER_REMOVE'], ...args);
    }
    public async handleGuildMembersChunk(...args: DispatchHandlerArgs<'GUILD_MEMBERS_CHUNK'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_MEMBERS_CHUNK', ['GUILD_MEMBERS_CHUNK'], ...args);
    }
    public async handleGuildMemberUpdate(...args: DispatchHandlerArgs<'GUILD_MEMBER_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_MEMBER_UPDATE', ['GUILD_MEMBER_UPDATE'], ...args);
    }
    public async handleGuildUpdate(...args: DispatchHandlerArgs<'GUILD_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_UPDATE', ['GUILD_UPDATE'], ...args);
    }
    public async handleGuildRoleDelete(...args: DispatchHandlerArgs<'GUILD_ROLE_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_ROLE_DELETE', ['GUILD_ROLE_DELETE'], ...args);
    }
    public async handleGuildRoleCreate(...args: DispatchHandlerArgs<'GUILD_ROLE_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_ROLE_CREATE', ['GUILD_ROLE_CREATE'], ...args);
    }
    public async handleGuildRoleUpdate(...args: DispatchHandlerArgs<'GUILD_ROLE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_ROLE_UPDATE', ['GUILD_ROLE_UPDATE'], ...args);
    }
    public async handleGuildScheduledEventCreate(...args: DispatchHandlerArgs<'GUILD_SCHEDULED_EVENT_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_SCHEDULED_EVENT_CREATE', ['GUILD_SCHEDULED_EVENT_CREATE'], ...args);
    }
    public async handleGuildScheduledEventUpdate(...args: DispatchHandlerArgs<'GUILD_SCHEDULED_EVENT_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_SCHEDULED_EVENT_UPDATE', ['GUILD_SCHEDULED_EVENT_UPDATE'], ...args);
    }
    public async handleGuildScheduledEventDelete(...args: DispatchHandlerArgs<'GUILD_SCHEDULED_EVENT_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_SCHEDULED_EVENT_DELETE', ['GUILD_SCHEDULED_EVENT_DELETE'], ...args);
    }
    public async handleGuildScheduledEventUserAdd(...args: DispatchHandlerArgs<'GUILD_SCHEDULED_EVENT_USER_ADD'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_SCHEDULED_EVENT_USER_ADD', ['GUILD_SCHEDULED_EVENT_USER_ADD'], ...args);
    }
    public async handleGuildScheduledEventUserRemove(...args: DispatchHandlerArgs<'GUILD_SCHEDULED_EVENT_USER_REMOVE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_SCHEDULED_EVENT_USER_REMOVE', ['GUILD_SCHEDULED_EVENT_USER_REMOVE'], ...args);
    }
    public async handleGuildStickersUpdate(...args: DispatchHandlerArgs<'GUILD_STICKERS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_STICKERS_UPDATE', ['GUILD_STICKERS_UPDATE'], ...args);
    }
    public async handleIntegrationCreate(...args: DispatchHandlerArgs<'INTEGRATION_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('INTEGRATION_CREATE', ['INTEGRATION_CREATE'], ...args);
    }
    public async handleIntegrationDelete(...args: DispatchHandlerArgs<'INTEGRATION_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('INTEGRATION_DELETE', ['INTEGRATION_DELETE'], ...args);
    }
    public async handleIntegrationUpdate(...args: DispatchHandlerArgs<'INTEGRATION_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('INTEGRATION_UPDATE', ['INTEGRATION_UPDATE'], ...args);
    }
    public async handleInteractionCreate(...args: DispatchHandlerArgs<'INTERACTION_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('INTERACTION_CREATE', ['INTERACTION_CREATE'], ...args);
    }
    public async handleInviteCreate(...args: DispatchHandlerArgs<'INVITE_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('INVITE_CREATE', ['INVITE_CREATE'], ...args);
    }
    public async handleInviteDelete(...args: DispatchHandlerArgs<'INVITE_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('INVITE_DELETE', ['INVITE_DELETE'], ...args);
    }
    public async handleMessageCreate(...args: DispatchHandlerArgs<'MESSAGE_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('MESSAGE_CREATE', ['MESSAGE_CREATE'], ...args);
    }
    public async handleMessageDeleteBulk(...args: DispatchHandlerArgs<'MESSAGE_DELETE_BULK'>): Promise<MessageHandle> {
        return await this.#handleDispatches('MESSAGE_DELETE_BULK', ['MESSAGE_DELETE_BULK'], ...args);
    }
    public async handleMessageDelete(...args: DispatchHandlerArgs<'MESSAGE_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('MESSAGE_DELETE', ['MESSAGE_DELETE'], ...args);
    }
    public async handleMessageReactionAdd(...args: DispatchHandlerArgs<'MESSAGE_REACTION_ADD'>): Promise<MessageHandle> {
        return await this.#handleDispatches('MESSAGE_REACTION_ADD', ['MESSAGE_REACTION_ADD'], ...args);
    }
    public async handleMessageReactionRemoveAll(...args: DispatchHandlerArgs<'MESSAGE_REACTION_REMOVE_ALL'>): Promise<MessageHandle> {
        return await this.#handleDispatches('MESSAGE_REACTION_REMOVE_ALL', ['MESSAGE_REACTION_REMOVE_ALL'], ...args);
    }
    public async handleMessageReactionRemove(...args: DispatchHandlerArgs<'MESSAGE_REACTION_REMOVE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('MESSAGE_REACTION_REMOVE', ['MESSAGE_REACTION_REMOVE'], ...args);
    }
    public async handleMessageReactionRemoveEmoji(...args: DispatchHandlerArgs<'MESSAGE_REACTION_REMOVE_EMOJI'>): Promise<MessageHandle> {
        return await this.#handleDispatches('MESSAGE_REACTION_REMOVE_EMOJI', ['MESSAGE_REACTION_REMOVE_EMOJI'], ...args);
    }
    public async handleMessageUpdate(...args: DispatchHandlerArgs<'MESSAGE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('MESSAGE_UPDATE', ['MESSAGE_UPDATE'], ...args);
    }
    public async handlePresenceUpdate(...args: DispatchHandlerArgs<'PRESENCE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('PRESENCE_UPDATE', ['PRESENCE_UPDATE'], ...args);
    }
    public async handleStageInstanceCreate(...args: DispatchHandlerArgs<'STAGE_INSTANCE_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('STAGE_INSTANCE_CREATE', ['STAGE_INSTANCE_CREATE'], ...args);
    }
    public async handleStageInstanceDelete(...args: DispatchHandlerArgs<'STAGE_INSTANCE_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('STAGE_INSTANCE_DELETE', ['STAGE_INSTANCE_DELETE'], ...args);
    }
    public async handleStageInstanceUpdate(...args: DispatchHandlerArgs<'STAGE_INSTANCE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('STAGE_INSTANCE_UPDATE', ['STAGE_INSTANCE_UPDATE'], ...args);
    }
    public async handleReady(...args: DispatchHandlerArgs<'READY'>): Promise<MessageHandle> {
        return await this.#handleDispatches('READY', ['READY'], ...args);
    }
    public async handleResumed(...args: DispatchHandlerArgs<'RESUMED'>): Promise<MessageHandle> {
        return await this.#handleDispatches('RESUMED', ['RESUMED'], ...args);
    }
    public async handleThreadListSync(...args: DispatchHandlerArgs<'THREAD_LIST_SYNC'>): Promise<MessageHandle> {
        return await this.#handleDispatches('THREAD_LIST_SYNC', ['THREAD_LIST_SYNC'], ...args);
    }
    public async handleThreadMembersUpdate(...args: DispatchHandlerArgs<'THREAD_MEMBERS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('THREAD_MEMBERS_UPDATE', ['THREAD_MEMBERS_UPDATE'], ...args);
    }
    public async handleThreadMemberUpdate(...args: DispatchHandlerArgs<'THREAD_MEMBER_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('THREAD_MEMBER_UPDATE', ['THREAD_MEMBER_UPDATE'], ...args);
    }
    public async handleThreadCreate(...args: DispatchHandlerArgs<'THREAD_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('THREAD_CREATE', ['THREAD_CREATE'], ...args);
    }
    public async handleThreadDelete(...args: DispatchHandlerArgs<'THREAD_DELETE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('THREAD_DELETE', ['THREAD_DELETE'], ...args);
    }
    public async handleThreadUpdate(...args: DispatchHandlerArgs<'THREAD_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('THREAD_UPDATE', ['THREAD_UPDATE'], ...args);
    }
    public async handleTypingStart(...args: DispatchHandlerArgs<'TYPING_START'>): Promise<MessageHandle> {
        return await this.#handleDispatches('TYPING_START', ['TYPING_START'], ...args);
    }
    public async handleUserUpdate(...args: DispatchHandlerArgs<'USER_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('USER_UPDATE', ['USER_UPDATE'], ...args);
    }
    public async handleVoiceServerUpdate(...args: DispatchHandlerArgs<'VOICE_SERVER_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('VOICE_SERVER_UPDATE', ['VOICE_SERVER_UPDATE'], ...args);
    }
    public async handleVoiceStateUpdate(...args: DispatchHandlerArgs<'VOICE_STATE_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('VOICE_STATE_UPDATE', ['VOICE_STATE_UPDATE'], ...args);
    }
    public async handleWebhooksUpdate(...args: DispatchHandlerArgs<'WEBHOOKS_UPDATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('WEBHOOKS_UPDATE', ['WEBHOOKS_UPDATE'], ...args);
    }
    public async handleGuildAuditLogEntryCreate(...args: DispatchHandlerArgs<'GUILD_AUDIT_LOG_ENTRY_CREATE'>): Promise<MessageHandle> {
        return await this.#handleDispatches('GUILD_AUDIT_LOG_ENTRY_CREATE', ['GUILD_AUDIT_LOG_ENTRY_CREATE'], ...args);
    }
}
