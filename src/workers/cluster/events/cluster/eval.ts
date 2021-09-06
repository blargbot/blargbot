import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { EvalResult } from '@core/types';

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
