import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

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
