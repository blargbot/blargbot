import type { AmqpChannel } from '../AmqpChannel.js';
import { ClusterStats } from '../messages/ClusterStats.js';
import { DiscordGatewayRequest } from '../messages/DiscordGatewayRequest.js';
import { EmptyMessage } from '../messages/EmptyMessage.js';
import { IdentifyShardRequest } from '../messages/IdentifyShardRequest.js';
import { IdentifyShardResponse } from '../messages/IdentifyShardResponse.js';
import { KillWorkerRequest } from '../messages/KillWorkerRequest.js';
import { PermitShardIdentifyRequest } from '../messages/PermitShardIdentifyRequest.js';
import { PermitShardIdentifyResponse } from '../messages/PermitShardIdentifyResponse.js';
import { SetPresenceRequest } from '../messages/SetPresenceRequest.js';
import { SwitchShardsRequest } from '../messages/SwitchShardsRequest.js';
import { inferReturnType } from '../util.js';
import { amqpChannelHelper } from './channelMethods.js';

export const getDiscordGatewayOrchestrationChannel = inferReturnType(async (channel: AmqpChannel, clusterId: string) => {
    const exchange = await channel.assertExchange('discord-cluster', 'direct');
    const x = amqpChannelHelper.onExchange(channel, exchange);
    return amqpChannelHelper.merge(
        x.defineNotification({
            routingKey: 'set-presence',
            send: 'setPresence',
            handle: 'handleSetPresence',
            encoder: SetPresenceRequest
        }),
        x.defineNotification({
            routingKey: 'kill-worker',
            send: 'killWorker',
            handle: 'handleKillWorker',
            encoder: KillWorkerRequest
        }),
        x.defineNotification({
            routingKey: 'prune-shards',
            send: 'pruneShards',
            handle: 'handlePruneShards',
            encoder: EmptyMessage
        }),
        x.defineWorkerNotification({
            workerId: clusterId,
            routingKey: 'send-gateway-event',
            send: 'sendToGateway',
            handle: 'handleSendToGateway',
            encoder: DiscordGatewayRequest
        }),
        x.defineNotification({
            routingKey: 'switch-shards',
            send: 'switchShards',
            handle: 'handleSwitchShards',
            encoder: SwitchShardsRequest
        }),
        x.defineNotification({
            routingKey: 'cluster-stats',
            send: 'postStats',
            handle: 'handleStats',
            encoder: ClusterStats
        }),
        x.defineRequest({
            routingKey: 'permit-identify',
            send: 'permitIdentify',
            handle: 'handlePermitIdentify',
            requestEncoder: PermitShardIdentifyRequest,
            responseEncoder: PermitShardIdentifyResponse
        }),
        x.defineWorkerRequest({
            workerId: clusterId,
            routingKey: 'request-identify',
            send: 'identifyShard',
            handle: 'handleIdentifyShard',
            requestEncoder: IdentifyShardRequest,
            responseEncoder: IdentifyShardResponse
        })
    );
});
export type DiscordGatewayOrchestrationChannel = Awaited<ReturnType<typeof getDiscordGatewayOrchestrationChannel>>;
