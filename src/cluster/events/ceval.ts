import { ClusterEventService } from '../../structures/ClusterEventService';
import { ProcessMessageHandler } from '../../workers/core/IPCEvents';
import { Cluster } from '../Cluster';


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
