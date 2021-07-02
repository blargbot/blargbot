import moment from 'moment';
import { ClusterConnection } from '../../cluster';
import { codeBlock, WorkerPoolEventService, WorkerState } from '../core';
import { Master } from '../Master';
import { LogHandler } from './log';

export class ExitHandler extends WorkerPoolEventService<ClusterConnection> {
    public constructor(
        public readonly master: Master
    ) {
        super(master.clusters, 'exit');
    }

    protected async execute(worker: ClusterConnection): Promise<void> {
        if (worker.state !== WorkerState.EXITED)
            return;
        const logTracker = this.master.eventHandlers.get(LogHandler.name, LogHandler);
        if (logTracker) {
            const logs = logTracker.get(worker.id);
            const logString = logs.slice(Math.max(logs.length - 5, 0))
                .map(m => `[${m.timestamp}][${m.level}] ${m.text}`)
                .join('\n');
            void this.master.discord.createMessage(
                this.master.config.discord.channels.shardlog,
                `Cluster ${worker.id} has died.\n\nLast 5 console outputs:${codeBlock(logString, 'md')}`.slice(0, 2000));
            logs.splice(0, logs.length);
        }
        const diedAt = moment();
        this.master.logger.cluster(`Cluster ${worker.id} has died, respawning...`);
        await this.master.clusters.spawn(worker.id);
        this.master.logger.cluster(`Cluster ${worker.id} is back after ${moment.duration(moment().diff(diedAt)).asSeconds()} seconds`);
    }
}

