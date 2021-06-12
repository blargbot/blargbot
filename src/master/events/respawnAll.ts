import { Timer } from '../../structures/Timer';
import { WorkerPoolEventService } from '../../structures/WorkerPoolEventService';
import { ClusterConnection } from '../../workers/ClusterConnection';
import { Master } from '../Master';

export class RespawnAll extends WorkerPoolEventService<ClusterConnection> {
    public constructor(private readonly master: Master) {
        super(master.clusters, 'respawnAll');
    }

    protected async execute(_: unknown, data: string): Promise<void> {
        this.master.logger.log('Respawning all clusters');
        const timer = new Timer().start();
        await this.master.clusters.spawnAll();
        timer.end();
        await this.master.util.send(data, `I'm back! It only took me ${timer.format()}.`);
        this.master.logger.log('Respawn complete');
    }
}