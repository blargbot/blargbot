import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Timer } from '@core/Timer';
import { mapping } from '@core/utils';
import { Master } from '@master';

export class ClusterRespawnAllHandler extends WorkerPoolEventService<ClusterConnection, string> {
    public constructor(private readonly master: Master) {
        super(
            master.clusters,
            'respawnAll',
            mapping.mapString,
            async ({ data }) => {
                await this.respawnAll(data);
            });
    }

    public async respawnAll(channelId: string): Promise<void> {
        this.master.logger.log('Respawning all clusters');
        const timer = new Timer().start();
        await this.master.clusters.spawnAll();
        timer.end();
        await this.master.util.send(channelId, `I'm back! It only took me ${timer.format()}.`);
        this.master.logger.log('Respawn complete');
    }
}
