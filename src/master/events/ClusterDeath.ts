import moment from 'moment';
import { BaseService } from '../../structures/BaseService';
import { ClusterConnection } from '../../workers/ClusterConnection';
import { Master } from '../Master';

export class ClusterDeath extends BaseService {
    public readonly type = 'cluster';
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #messageHandler: (worker: ClusterConnection) => void;

    public constructor(
        public readonly master: Master
    ) {
        super();
        this.#messageHandler = worker => {
            if (!worker.killed)
                void this.respawn(worker.id);
        };
    }

    public start(): void {
        this.master.clusters.on('worker:disconnect', this.#messageHandler);
        this.master.clusters.on('worker:exit', this.#messageHandler);
        this.master.clusters.on('worker:close', this.#messageHandler);
    }

    public stop(): void {
        this.master.clusters.off('worker:disconnect', this.#messageHandler);
        this.master.clusters.off('worker:exit', this.#messageHandler);
        this.master.clusters.off('worker:close', this.#messageHandler);
    }

    private async respawn(id: number): Promise<void> {
        const diedAt = moment();
        this.master.logger.worker(`Cluster ${id} has died, respawning...`);
        await this.master.clusters.spawn(id);
        this.master.logger.worker(`Cluster ${id} is back after ${moment.duration(moment().diff(diedAt)).asSeconds()} seconds`);
    }
}