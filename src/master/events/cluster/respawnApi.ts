import { ClusterConnection } from '@blargbot/cluster';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';

export class RespawnApiHandler extends WorkerPoolEventService<ClusterConnection, 'respawnApi'> {
    public constructor(private readonly master: Master) {
        super(
            master.clusters,
            'respawnApi',
            async ({ reply }) => {
                await this.respawnApi();
                reply(true);
            }
        );
    }

    public async respawnApi(): Promise<void> {
        await this.master.api.killAll();
        await this.master.api.spawnAll();
    }
}
