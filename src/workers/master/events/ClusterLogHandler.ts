import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { LogEntry } from '@core/types';
import { Master } from '@master';
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
