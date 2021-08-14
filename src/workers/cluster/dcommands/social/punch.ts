import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class PunchCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('punch', 'punch', 'punches', 'user', 'Punch someone. They probably deserved it.', cluster.config.general.wolke);
    }
}
