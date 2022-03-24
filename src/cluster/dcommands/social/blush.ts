import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class BlushCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('blush', {
            search: 'blush',
            action: 'blushes',
            description: 'Show everyone that you\'re blushing.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
