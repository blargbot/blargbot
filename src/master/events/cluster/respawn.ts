import { ClusterConnection } from '@blargbot/cluster';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { Timer } from '@blargbot/core/Timer';
import { literal } from '@blargbot/domain/messages/types';
import { Master } from '@blargbot/master';

export class ClusterRespawnHandler extends WorkerPoolEventService<ClusterConnection, 'respawn'> {
    public constructor(
        public readonly master: Master
    ) {
        super(master.clusters, 'respawn', ({ worker, data }) => this.respawn(data.id ?? worker.id, data.channel));
    }

    public async respawn(workerId: number, channelId: string): Promise<void> {
        this.master.logger.log('Respawning a shard');
        const timer = new Timer().start();
        await this.master.clusters.spawn(workerId);
        timer.end();
        await this.master.util.send(channelId, new FormattableMessageContent({
            content: literal(`The shard has been successfully respawned! It only took me ${timer.format()}`)
        }));
    }
}
