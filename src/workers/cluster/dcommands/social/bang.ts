import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class BangCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('bang', 'bang', 'bangs', 'self', 'Bang bang!', cluster.config.general.wolke);
    }
}
