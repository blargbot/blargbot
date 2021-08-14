import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class WagCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('wag', 'wag', 'wags', 'self', 'Wagwagwagwag', cluster.config.general.wolke);
    }
}
