import { ClusterConnection } from '@blargbot/cluster';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { WorkerState } from '@blargbot/core/worker';
import { util } from '@blargbot/formatting';
import { Master } from '@blargbot/master';
import moment from 'moment-timezone';

export class ClusterExitHandler extends WorkerPoolEventService<ClusterConnection, 'exit'> {
    public constructor(
        public readonly master: Master
    ) {
        super(master.clusters, 'exit', ({ worker }) => this.alertExit(worker));
    }

    public async alertExit(worker: ClusterConnection): Promise<void> {
        if (worker.state !== WorkerState.EXITED)
            return;

        void this.master.util.send(
            this.master.config.discord.channels.shardlog,
            new FormattableMessageContent({
                content: util.literal(`Cluster ${worker.id} has died.`),
                files: [{
                    file: worker.logs.join('\n'),
                    name: `cluster ${worker.id}.log`
                }]
            })
        );

        const diedAt = moment();
        this.master.logger.cluster(`Cluster ${worker.id} has died, respawning...`);
        await this.master.clusters.spawn(worker.id);
        this.master.logger.cluster(`Cluster ${worker.id} is back after ${moment.duration(moment().diff(diedAt)).asSeconds()} seconds`);
    }
}
