import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { Timer } from '@core/Timer';
import { Master } from '@master';

export class ClusterRespawnAllHandler extends WorkerPoolEventService<ClusterConnection, 'respawnAll'> {
    public constructor(private readonly master: Master) {
        super(
            master.clusters,
            'respawnAll',
            async ({ data }) => {
                await this.respawnAll(data.channelId);
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
