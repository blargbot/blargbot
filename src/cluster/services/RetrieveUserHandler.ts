import { User } from 'eris';
import { ClusterEventService } from '../../structures/ClusterEventService';
import { Cluster } from '../Cluster';


export class RetrieveUserHandler extends ClusterEventService<'retrieveUser'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'retrieveUser');
    }

    protected execute(id: string, reply: (data: User | null) => void): void {
        reply(this.cluster.discord.users.get(id) ?? null);
    }
}
