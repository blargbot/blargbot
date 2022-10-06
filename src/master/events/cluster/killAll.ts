import { ClusterConnection } from '@blargbot/cluster';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { Master } from '@blargbot/master';

export class ClusterKillAllHandler extends WorkerPoolEventService<ClusterConnection, `killAll`> {
    readonly #master: Master;

    public constructor(master: Master) {
        super(master.clusters, `killAll`, () => this.killAll());
        this.#master = master;
    }

    protected async killAll(): Promise<never> {
        this.#master.logger.fatal(`We all deserve to die. Even you, mister cat. Even I.`);
        await Promise.all([
            this.#master.clusters.killAll(),
            this.#master.api.killAll()
        ]);
        process.exit(0);
    }
}
