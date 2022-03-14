import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

export class BlushCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('blush', {
            search: 'blush',
            action: 'blushes',
            description: 'Show everyone that you\'re blushing.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
