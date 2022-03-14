import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

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
