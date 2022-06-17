import { ClusterConnection } from '@blargbot/cluster';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { LogEntry } from '@blargbot/core/types';
import { Master } from '@blargbot/master';
import stripAnsi from 'strip-ansi';

export class ClusterLogHandler extends WorkerPoolEventService<ClusterConnection, 'log'> {

    public constructor(
        public readonly master: Master
    ) {
        super(
            master.clusters,
            'log',
            ({ worker, data }) => this.addLog(worker.id, data)
        );
    }

    protected addLog(workerId: number, log: LogEntry): void {
        this.master.logHistory.push(workerId, { ...log, text: stripAnsi(log.text) });
    }
}
