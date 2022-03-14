import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

export class SmugCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('smug', {
            search: 'smug',
            action: 'is smug',
            description: 'Let out your inner smugness.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
