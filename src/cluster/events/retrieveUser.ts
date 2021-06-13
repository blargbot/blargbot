import { ClusterEventService } from '../../structures/ClusterEventService';
import { ProcessMessageHandler } from '../../workers/core/IPCEvents';
import { Cluster } from '../Cluster';


export class RetrieveUserHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'retrieveUser');
    }

    protected execute([id, , reply]: Parameters<ProcessMessageHandler>): void {
        reply(this.cluster.discord.users.get(id) ?? null);
    }
}
