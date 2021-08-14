import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class BangCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('bang', {
            search: 'bang',
            action: 'bangs',
            description: 'Bang bang!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
