import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class CryCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('cry', {
            search: 'cry',
            action: 'cries',
            description: 'Show everyone that you\'re crying.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
