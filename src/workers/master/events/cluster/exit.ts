import { ClusterConnection } from '@cluster';
import { codeBlock } from '@cluster/utils';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { WorkerState } from '@core/worker';
import { Master } from '@master';
import moment from 'moment';

export class ClusterExitHandler extends WorkerPoolEventService<ClusterConnection, 'exit'> {
    public constructor(
        public readonly master: Master
    ) {
        super(master.clusters, 'exit', ({ worker }) => this.alertExit(worker));
    }

    public async alertExit(worker: ClusterConnection): Promise<void> {
        if (worker.state !== WorkerState.EXITED)
            return;

        const logs = this.master.logHistory.clear(worker.id);
        const logString = logs.slice(Math.max(logs.length - 5, 0))
            .map(m => `[${m.timestamp}][${m.level}] ${m.text}`)
            .join('\n');
        void this.master.util.send(
            this.master.config.discord.channels.shardlog,
            `Cluster ${worker.id} has died.\n\nLast 5 console outputs:${codeBlock(logString, 'md')}`.slice(0, 2000));

        const diedAt = moment();
        this.master.logger.cluster(`Cluster ${worker.id} has died, respawning...`);
        await this.master.clusters.spawn(worker.id);
        this.master.logger.cluster(`Cluster ${worker.id} is back after ${moment.duration(moment().diff(diedAt)).asSeconds()} seconds`);
    }
}
