import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

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
