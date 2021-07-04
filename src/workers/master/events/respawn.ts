import { ClusterConnection, ClusterRespawnRequest } from '../../cluster';
import { WorkerPoolEventService, Timer } from '../core';
import { Master } from '../Master';

export class RespawnHandler extends WorkerPoolEventService<ClusterConnection> {
    public constructor(
        public readonly master: Master
    ) {
        super(master.clusters, 'respawn');
    }

    protected async execute(worker: ClusterConnection, { id, channel }: ClusterRespawnRequest): Promise<void> {
        this.master.logger.log('Respawning a shard');
        const timer = new Timer().start();
        id ??= worker.id;
        await this.master.clusters.spawn(id);
        timer.end();
        await this.master.discord.createMessage(channel, `The shard has been successfully respawned! It only took me ${timer.format()}`);
    }
}
