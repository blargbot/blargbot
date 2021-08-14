import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class LewdCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('lewd', 'lewd', 'is lewd 😳', 'self', 'T-that\'s lewd...', cluster.config.general.wolke);
    }
}
