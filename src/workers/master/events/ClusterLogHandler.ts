import { ClusterConnection } from '@cluster';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { LogEntry } from '@core/types';
import { mapping } from '@core/utils';
import { Master } from '@master';
import stripAnsi from 'strip-ansi';

export class ClusterLogHandler extends WorkerPoolEventService<ClusterConnection, LogEntry> {

    public constructor(
        public readonly master: Master
    ) {
        super(
            master.clusters,
            'log',
            mapping.mapObject({
                level: mapping.mapString,
                text: mapping.mapString,
                timestamp: mapping.mapString
            }),
            ({ worker, data }) => this.addLog(worker.id, data)
        );
    }

    protected addLog(workerId: number, log: LogEntry): void {
        this.master.logHistory.push(workerId, { ...log, text: stripAnsi(log.text) });
    }
}
