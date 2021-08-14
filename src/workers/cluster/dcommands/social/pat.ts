import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class PatCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('pat', 'pat', 'pats', 'user', 'Give somebody a lovely pat.', cluster.config.general.wolke);
    }
}
