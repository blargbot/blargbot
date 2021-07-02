import { Cluster } from '../Cluster';
import { ClusterEventService, ProcessMessageHandler } from '../core';


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
