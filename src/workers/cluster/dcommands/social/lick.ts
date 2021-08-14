import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class LickCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('lick', 'lick', 'licks', 'user', 'Give someone a lick. Sluurrpppp!', cluster.config.general.wolke);
    }
}
