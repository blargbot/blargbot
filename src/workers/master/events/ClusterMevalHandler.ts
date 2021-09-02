import { ClusterConnection } from '@cluster';
import { mapping, parse } from '@cluster/utils';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { EvalRequest, EvalResult, EvalType, MasterEvalRequest, MasterEvalResult } from '@core/types';
import { Master } from '@master';

export class ClusterMevalHandler extends WorkerPoolEventService<ClusterConnection, MasterEvalRequest, MasterEvalResult | EvalResult> {
    public constructor(private readonly master: Master) {
        super(
            master.clusters,
            'meval',
            mapping.mapObject({
                code: mapping.mapString,
                type: mapping.mapRegex<EvalType>(/master|global|cluster\d+/),
                userId: mapping.mapString
            }),
            async ({ data, reply }) => {
                reply(await this.eval(data.type, data.userId, data.code));
            }
        );
    }

    public async eval(type: EvalType, userId: string, code: string): Promise<MasterEvalResult | EvalResult> {
        switch (type) {
            case 'master': {
                try {
                    return await this.master.eval(userId, code);
                } catch (ex: unknown) {
                    return { success: false, error: ex };
                }
            }
            case 'global': {
                const results: MasterEvalResult = {};
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

        const result = mapEvalResult(await cluster.request('ceval', request));
        if (result.valid)
            return result.value;

        return { success: false, error: 'Invalid response from cluster' };
    }
}

const mapEvalResult = mapping.mapChoice<EvalResult[]>(
    mapping.mapObject({
        success: mapping.mapIn(true),
        result: mapping.mapUnknown
    }),
    mapping.mapObject({
        success: mapping.mapIn(false),
        error: mapping.mapUnknown
    })
);
