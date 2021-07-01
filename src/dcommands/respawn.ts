import { Cluster } from '../cluster';
import { commandTypes, humanize } from '../utils';
import { BaseCommand, CommandContext } from '../core/command';
import { ClusterRespawnRequest } from '../workers/ClusterTypes';

export class RespawnCommand extends BaseCommand {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'respawn',
            category: commandTypes.GENERAL,
            hidden: true,
            info: 'Cluster respawning only for staff.',
            definition: {
                parameters: '{clusterId:integer}',
                execute: (ctx, [clusterId]) => this.respawn(ctx, clusterId),
                description: 'Respawns the cluster specified'
            }
        });
    }

    public async respawn(context: CommandContext, clusterId?: number): Promise<void> {
        if (!await context.cluster.util.isPolice(context.author.id))
            return;

        await this.util.send(this.config.discord.channels.shardlog, `**${humanize.fullName(context.author)}** has called for a respawn of cluster ${clusterId}.`);
        this.cluster.worker.send('respawn', <ClusterRespawnRequest>{ id: clusterId, channel: context.channel.id });
        await this.util.send(context, `ok cluster ${clusterId} is being respawned and stuff now`);
    }
}