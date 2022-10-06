import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes';
import { EvalResult } from '@blargbot/core/types';

export class ClusterEvalHandler extends ClusterEventService<`ceval`> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, `ceval`, async ({ data, reply }) => reply(await this.eval(data.userId, data.code)));
    }

    protected async eval(userId: string, code: string): Promise<EvalResult> {
        return await this.cluster.eval(userId, code);
    }
}
