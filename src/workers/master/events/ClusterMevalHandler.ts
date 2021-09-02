import { ClusterConnection } from '@cluster';
import { parse } from '@cluster/utils';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { EvalRequest, EvalResult, MasterEvalRequest, MasterEvalResult, WorkerPoolEventHandler } from '@core/types';
import { Master } from '@master';

export class ClusterMevalHandler extends WorkerPoolEventService<ClusterConnection> {
    public constructor(private readonly master: Master) {
        super(master.clusters, 'meval');
    }

    protected async execute(...[, data, , reply]: Parameters<WorkerPoolEventHandler<ClusterConnection>>): Promise<void> {
        const { type, userId, code } = data as MasterEvalRequest;
        switch (type) {
            case 'master': {
                try {
                    return reply(await this.master.eval(userId, code));
                } catch (ex: unknown) {
                    return reply({ success: false, error: ex });
                }
            }
            case 'global': {
                const results: MasterEvalResult = {};
                const promises: Record<string, Promise<EvalResult>> = {};
                this.master.clusters.forEach(id => promises[`${id}`] = this.getClusterResult(id, { userId, code }));
                for (const [key, promise] of Object.entries(promises))
                    results[key] = await promise;
                return reply(results);
            }
            default: {
                const clusterId = parse.int(type.slice(7));
                reply(await this.getClusterResult(clusterId, { userId, code }));
            }
        }
    }

    private async getClusterResult(clusterId: number, request: EvalRequest): Promise<EvalResult> {
        const cluster = this.master.clusters.tryGet(clusterId);
        if (cluster === undefined)
            return { success: false, error: `Cluster ${clusterId} doesnt exist!` };
        return await cluster.request<EvalRequest, EvalResult>('ceval', request);

    }
}
