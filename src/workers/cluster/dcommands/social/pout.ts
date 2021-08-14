import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class PoutCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('pout', 'pout', 'pouts', 'self', 'Let everyone know that you\'re being pouty.', cluster.config.general.wolke);
    }
}
