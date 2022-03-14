import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

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
