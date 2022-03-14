import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

export class LewdCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('lewd', {
            search: 'lewd',
            action: 'is lewd 😳',
            description: 'T-that\'s lewd...',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
