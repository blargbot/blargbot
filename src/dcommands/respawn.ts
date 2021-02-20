import { Message } from 'eris';
import { Cluster } from '../cluster';
import { commandTypes, humanize, parse } from '../utils';
import { BaseCommand } from '../core/command';

export class RespawnCommand extends BaseCommand {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'respawn',
            category: commandTypes.GENERAL,
            hidden: true,
            info: 'Cluster respawning only for staff.'
        });

        this.setHandlers({
            '{clusterId:number}': (msg, [clusterId]) => this.respawn(msg, parse.int(clusterId))
        });
    }

    public async respawn(msg: Message, clusterId: number): Promise<void> {
        const police = await this.cluster.database.vars.get('police');
        if (police?.value.includes(msg.author.id) !== true)
            return;

        await this.util.send(this.config.discord.channels.shardlog, `**${humanize.fullName(msg.author)}** has called for a respawn of cluster ${clusterId}.`);
        this.cluster.worker.send('respawn', { id: clusterId, channel: msg.channel.id });
        await this.util.send(msg, `ok cluster ${clusterId} is being respawned and stuff now`);
    }
}

module.exports = RespawnCommand;
