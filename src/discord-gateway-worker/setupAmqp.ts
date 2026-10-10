import type { AmqpChannel } from '@blargbot/contracts';
import { getDiscordGatewayChannel, getDiscordGatewayOrchestrationChannel } from '@blargbot/contracts';

import type { ShardManager } from './ShardManager.js';

export async function setupAmqp(channel: AmqpChannel, shardManager: ShardManager, killWorker: AbortController): Promise<void> {
    const cluster = await getDiscordGatewayOrchestrationChannel(channel, shardManager.id);
    const gateway = await getDiscordGatewayChannel(channel);

    shardManager.handleGatewayMessage(request => gateway.dedupe(request));
    shardManager.handlePermitIdentify(request => cluster.permitIdentify(request));
    shardManager.handlePostStats(request => cluster.postStats(request));
    await cluster.handleSendToGateway(request => shardManager.send(request));
    await cluster.handleIdentifyShard(request => shardManager.identify(request));
    await cluster.handleSwitchShards(request => shardManager.switchShards(request));
    await cluster.handlePruneShards(() => shardManager.pruneShards());
    await cluster.handleSetPresence(request => shardManager.setPresence(request));
    await cluster.handleKillWorker(request => {
        if (request.workerId === shardManager.id)
            killWorker.abort(new Error('Worker has been requested to be killed.'));
    });
}
