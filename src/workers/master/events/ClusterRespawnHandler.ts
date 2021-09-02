import { ClusterConnection } from '@cluster';
import { ClusterRespawnRequest } from '@cluster/types';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Timer } from '@core/Timer';
import { mapping } from '@core/utils';
import { Master } from '@master';

export class ClusterRespawnHandler extends WorkerPoolEventService<ClusterConnection, ClusterRespawnRequest> {
    public constructor(
        public readonly master: Master
    ) {
        super(
            master.clusters,
            'respawn',
            mapping.mapObject({
                channel: mapping.mapString,
                id: mapping.mapOptionalNumber
            }),
            ({ worker, data }) => this.respawn(data.id ?? worker.id, data.channel)
        );
    }

    public async respawn(workerId: number, channelId: string): Promise<void> {
        this.master.logger.log('Respawning a shard');
        const timer = new Timer().start();
        await this.master.clusters.spawn(workerId);
        timer.end();
        await this.master.util.send(channelId, `The shard has been successfully respawned! It only took me ${timer.format()}`);
    }
}
