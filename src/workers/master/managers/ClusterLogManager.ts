import { RollingArray } from '@core/RollingArray';
import { LogEntry } from '@core/types';

export class ClusterLogManager {
    private readonly logMap: Record<number, RollingArray<LogEntry>>;
    public constructor(public readonly historySize: number) {
        this.logMap = {};
    }

    public push(clusterId: number, log: LogEntry): void {
        const logs = this.logMap[clusterId] ??= new RollingArray(this.historySize);
        logs.push(log);
    }

    public clear(clusterId: number): LogEntry[] {
        const logs = this.logMap[clusterId];
        if (logs === undefined)
            return [];

        delete this.logMap[clusterId];
        return [...logs];
    }

}
