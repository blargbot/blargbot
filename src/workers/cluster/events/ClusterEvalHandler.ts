import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { ProcessMessageHandler } from '@core/types';

export class ClusterEvalHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'ceval');
    }

    protected async execute(...[data, , reply]: Parameters<ProcessMessageHandler>): Promise<void> {
        const { userId, code } = <{ userId: string; code: string; }>data;
        reply(await this.cluster.eval(userId, code));
    }
}
