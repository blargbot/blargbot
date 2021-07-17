import { Cluster } from '@cluster';
import { ClusterEventService } from '@cluster/serviceTypes';
import { ProcessMessageHandler } from '@core/types';

export class ClusterRetrieveUserHandler extends ClusterEventService {
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
