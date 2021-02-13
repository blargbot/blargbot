import moment from 'moment';
import { codeBlock } from '../../utils';
import { WorkerPoolEventService } from '../../structures/WorkerPoolEventService';
import { ClusterConnection } from '../../workers/ClusterConnection';
import { WorkerState } from '../../workers/core/WorkerConnection';
import { Master } from '../Master';
import { ClusterLogTracker } from './ClusterLogTracker';

export class ClusterDeath extends WorkerPoolEventService<ClusterConnection> {
    public constructor(
        public readonly master: Master
    ) {
        super(master.clusters, 'exit');
    }

    protected async execute(worker: ClusterConnection): Promise<void> {
        if (worker.state !== WorkerState.RUNNING)
            return;
        const logTracker = this.master.eventHandlers.get(ClusterLogTracker.name, ClusterLogTracker);
        if (logTracker) {
            const logs = logTracker.get(worker.id);
            const logString = logs.slice(Math.max(logs.length - 5, 0))
                .map(m => `[${m.timestamp}][${m.level}] ${m.text}`)
                .join('\n');
            void this.master.discord.createMessage(
                this.master.config.discord.channels.shardlog,
                `Last 5 console outputs:${codeBlock(logString, 'md')}`.slice(0, 2000));
            logs.splice(0, logs.length);
        }
        const diedAt = moment();
        this.master.logger.worker(`Cluster ${worker.id} has died, respawning...`);
        await this.master.clusters.spawn(worker.id);
        this.master.logger.worker(`Cluster ${worker.id} is back after ${moment.duration(moment().diff(diedAt)).asSeconds()} seconds`);
    }
}

