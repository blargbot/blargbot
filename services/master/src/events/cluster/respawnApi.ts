import type { ClusterConnection } from '@blargbot/cluster';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes/index.js';
import type { Master } from '@blargbot/master';

export class RespawnApiHandler extends WorkerPoolEventService<ClusterConnection, 'respawnApi'> {
    readonly #master: Master;

    public constructor(master: Master) {
        super(
            master.clusters,
            'respawnApi',
            async ({ reply }) => {
                await this.respawnApi();
                reply(true);
            }
        );
        this.#master = master;
    }

    public async respawnApi(): Promise<void> {
        await this.#master.api.killAll();
        await this.#master.api.spawnAll();
    }
}
