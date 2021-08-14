import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class RemCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('rem', 'rem', undefined, 'none', 'Worst girl.', cluster.config.general.wolke);
    }
}
