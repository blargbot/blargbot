import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class WagCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('wag', {
            search: 'wag',
            action: 'wags',
            description: 'Wagwagwagwag',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
