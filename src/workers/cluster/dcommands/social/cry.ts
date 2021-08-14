import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class CryCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('cry', 'cry', 'cries', 'self', 'Show everyone that you\'re crying.', cluster.config.general.wolke);
    }
}
