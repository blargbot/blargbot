import type { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster';
import type { EvalResult } from '@blargbot/core';

export class ClusterEvalHandler extends ClusterEventService<'ceval'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'ceval', async ({ data, reply }) => reply(await this.eval(data.userId, data.code)));
    }

    protected async eval(userId: string, code: string): Promise<EvalResult> {
        return await this.cluster.eval(userId, code);
    }
}
