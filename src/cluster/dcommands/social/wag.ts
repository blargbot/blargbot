import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class WagCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('wag', {
            search: 'wag',
            action: 'wags',
            description: 'Wagwagwagwag',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
