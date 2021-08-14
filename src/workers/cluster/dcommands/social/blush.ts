import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class BlushCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('blush', 'blush', 'blushes', 'self', 'Show everyone that you\'re blushing.', cluster.config.general.wolke);
    }
}
