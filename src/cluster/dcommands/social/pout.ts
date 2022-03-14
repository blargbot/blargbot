import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class PoutCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('pout', {
            search: 'pout',
            action: 'pouts',
            description: 'Let everyone know that you\'re being pouty.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
