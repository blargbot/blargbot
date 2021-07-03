import { Cluster } from '../Cluster';
import { ClusterEventService, ProcessMessageHandler } from '../core';

export class RetrieveUserHandler extends ClusterEventService {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'retrieveUser');
    }

    protected execute([id, , reply]: Parameters<ProcessMessageHandler>): void {
        if (typeof id === 'string')
            reply(this.cluster.discord.users.get(id) ?? null);
        else
            reply(null);
    }
}
