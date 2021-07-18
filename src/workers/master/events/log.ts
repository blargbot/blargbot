import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { LogEntry } from '@core/types';
import { Master } from '@master';
import stripAnsi from 'strip-ansi';

export class LogHandler extends WorkerPoolEventService<ClusterConnection> {

    public constructor(
        public readonly master: Master
    ) {
        super(master.clusters, 'log');
    }

    protected execute(worker: ClusterConnection, { level, timestamp, text }: LogEntry): void {
        this.master.logHistory.push(worker.id, { level, timestamp, text: stripAnsi(text) });
    }
}
