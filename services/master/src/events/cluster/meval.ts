import { inspect } from 'node:util';

import { ClusterConnection } from '@blargbot/cluster';
import { parse } from '@blargbot/cluster/utils/index.js';
import { WorkerPoolEventService } from '@blargbot/core/serviceTypes/index.js';
import { EvalRequest, EvalResult, EvalType, GlobalEvalResult } from '@blargbot/core/types.js';
import { Master } from '@blargbot/master';

export class ClusterMevalHandler extends WorkerPoolEventService<ClusterConnection, 'meval'> {
    readonly #master: Master;

    public constructor(master: Master) {
        super(
            master.clusters,
            'meval',
            async ({ data, reply }) => {
                reply(await this.eval(data.type, data.userId, data.code));
            }
        );
        this.#master = master;
    }

    public async eval(type: EvalType, userId: string, code: string): Promise<GlobalEvalResult | EvalResult> {
        switch (type) {
            case 'master': {
                try {
                    return await this.#master.eval(userId, code);
                } catch (err: unknown) {
                    return { success: false, error: inspect(err) };
                }
            }
            case 'global': {
                const results: GlobalEvalResult = {};
                const promises: Record<string, Promise<EvalResult>> = {};
                this.#master.clusters.forEach(id => promises[`${id}`] = this.#getClusterResult(id, { userId, code }));
                for (const [key, promise] of Object.entries(promises))
                    results[key] = await promise;
                return results;
            }
            default: {
                const clusterId = parse.int(type.slice(7), { strict: true });
                if (clusterId === undefined)
                    return { success: false, error: `Cluster ${type.slice(7)} doesnt exist!` };

                return await this.#getClusterResult(clusterId, { userId, code });
            }
        }
    }

    async #getClusterResult(clusterId: number, request: EvalRequest): Promise<EvalResult> {
        const cluster = this.#master.clusters.tryGet(clusterId);
        if (cluster === undefined)
            return { success: false, error: `Cluster ${clusterId} doesnt exist!` };

        return await cluster.request('ceval', request);
    }
}
