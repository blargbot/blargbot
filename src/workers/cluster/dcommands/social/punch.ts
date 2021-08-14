import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class PunchCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('punch', {
            search: 'punch',
            action: 'punches',
            user: true,
            description: 'Punch someone. They probably deserved it.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
