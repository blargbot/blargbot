import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class SmugCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('smug', 'smug', 'is smug', 'self', 'Let out your inner smugness.', cluster.config.general.wolke);
    }
}
