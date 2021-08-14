import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class CuddleCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('cuddle', 'cuddle', 'cuddles with', 'user', 'Cuddle with someone.', cluster.config.general.wolke);
    }
}
