import { ClusterConnection } from '@blargbot/cluster';
import { parse } from '@blargbot/cluster/utils';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes';
import { EvalRequest, EvalResult, EvalType, GlobalEvalResult } from '@blargbot/core/types';
import { Master } from '@blargbot/master';
import { inspect } from 'util';

export class ClusterMevalHandler extends WorkerPoolEventService<ClusterConnection, 'meval'> {
    public constructor(private readonly master: Master) {
        super(
            master.clusters,
            'meval',
            async ({ data, reply }) => {
                reply(await this.eval(data.type, data.userId, data.code));
            }
        );
    }

    public async eval(type: EvalType, userId: string, code: string): Promise<GlobalEvalResult | EvalResult> {
        switch (type) {
            case 'master': {
                try {
                    return await this.master.eval(userId, code);
                } catch (err: unknown) {
                    return { success: false, error: inspect(err) };
                }
            }
            case 'global': {
                const results: GlobalEvalResult = {};
                const promises: Record<string, Promise<EvalResult>> = {};
                this.master.clusters.forEach(id => promises[`${id}`] = this.getClusterResult(id, { userId, code }));
                for (const [key, promise] of Object.entries(promises))
                    results[key] = await promise;
                return results;
            }
            default: {
                const clusterId = parse.int(type.slice(7));
                return await this.getClusterResult(clusterId, { userId, code });
            }
        }
    }

    private async getClusterResult(clusterId: number, request: EvalRequest): Promise<EvalResult> {
        const cluster = this.master.clusters.tryGet(clusterId);
        if (cluster === undefined)
            return { success: false, error: `Cluster ${clusterId} doesnt exist!` };

        return await cluster.request('ceval', request);
    }
}
