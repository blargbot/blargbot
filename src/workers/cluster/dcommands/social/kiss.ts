import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class KissCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('kiss', 'kiss', 'kisses', 'user', 'Give someone a kiss!', cluster.config.general.wolke);
    }
}
