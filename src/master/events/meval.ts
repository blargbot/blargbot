import { WorkerPoolEventService } from '../../structures/WorkerPoolEventService';
import { parse } from '../../utils';
import { ClusterConnection } from '../../workers/ClusterConnection';
import { WorkerPoolEventHandler } from '../../workers/core/WorkerPool';
import { Master } from '../Master';

type EvalType = 'master' | 'global' | `cluster${number}`

export class MasterEval extends WorkerPoolEventService<ClusterConnection> {
    public constructor(private readonly master: Master) {
        super(master.clusters, 'meval');
    }

    protected async execute(...[, data, , reply]: Parameters<WorkerPoolEventHandler<ClusterConnection>>): Promise<void> {
        const { type, userId, code } = <{ type: EvalType, userId: string; code: string; }>data;
        switch (type) {
            case 'master': {
                try {
                    return reply(await this.master.eval(userId, code));
                } catch (ex) {
                    return reply({ success: false, result: ex });
                }
            }
            case 'global': {
                const results: Record<number, unknown> = {};
                const requests: Array<Promise<unknown>> = [];
                this.master.clusters.forEach((id, c) => requests.push((async () => results[id] = await c?.request('ceval', { userId, code }))()));
                await Promise.all(requests);
                return reply(results);
            }
            default: {
                const clusterId = parse.int(type.slice(7));
                return reply(await this.master.clusters.tryGet(clusterId)?.request('ceval', { userId, code }));
            }
        }
    }
}
