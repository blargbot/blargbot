import { BaseGlobalCommand, CommandContext } from '@blargbot/cluster/command';
import { ClusterRespawnRequest } from '@blargbot/cluster/types';
import { CommandType, humanize } from '@blargbot/cluster/utils';

export class RespawnCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'respawn',
            category: CommandType.STAFF,
            description: 'Cluster respawning only for staff.',
            definitions: [
                {
                    parameters: '{clusterId:integer}',
                    execute: (ctx, [clusterId]) => this.respawn(ctx, clusterId.asInteger),
                    description: 'Respawns the cluster specified'
                }
            ]
        });
    }

    public async respawn(context: CommandContext, clusterId: number): Promise<string> {
        await context.send(context.config.discord.channels.shardlog, `**${humanize.fullName(context.author)}** has called for a respawn of cluster ${clusterId}.`);
        context.cluster.worker.send('respawn', <ClusterRespawnRequest>{ id: clusterId, channel: context.channel.id });
        return this.success(`Cluster ${clusterId} is being respawned and stuff now`);
    }
}
