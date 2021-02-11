import { RollingArray } from '../../structures/RollingArray';
import { WorkerPoolEventService } from '../../structures/WorkerPoolEventService';
import { ClusterConnection } from '../../workers/ClusterConnection';
import { Master } from '../Master';
import stripAnsi from 'strip-ansi';
import { LogEntry } from '../../workers/core/BaseWorker';

export class ClusterLogTracker extends WorkerPoolEventService<ClusterConnection> {
    private readonly logs: { [workerId: number]: RollingArray<LogEntry> | undefined };

    public constructor(
        public readonly master: Master
    ) {
        super(master.clusters, 'log');
        this.logs = {};
    }

    public get(workerId: number): RollingArray<LogEntry> {
        return this.logs[workerId] ??= new RollingArray(30);
    }

    protected execute(worker: ClusterConnection, { level, timestamp, text }: LogEntry): void {
        this.get(worker.id).push({ level, timestamp, text: stripAnsi(text) });
    }
}

