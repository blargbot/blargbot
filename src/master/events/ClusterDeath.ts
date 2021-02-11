import moment from 'moment';
import { codeBlock } from '../../newbu';
import { WorkerPoolEventService } from '../../structures/WorkerPoolEventService';
import { ClusterConnection } from '../../workers/ClusterConnection';
import { Master } from '../Master';
import { ClusterLog } from './ClusterLog';

export class ClusterDeath extends WorkerPoolEventService<ClusterConnection> {
    public constructor(
        public readonly master: Master
    ) {
        super(master.clusters, 'exit');
    }

    protected async execute(worker: ClusterConnection): Promise<void> {
        const logTracker = this.master.eventHandlers.get(ClusterLog.name);
        if (logTracker !== undefined && logTracker instanceof ClusterLog) {
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

