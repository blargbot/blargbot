import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

export class HugCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('hug', {
            search: 'hug',
            action: 'hugs',
            user: true,
            description: 'Give somebody a hug.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
