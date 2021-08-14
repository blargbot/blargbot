import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class HugCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('hug', 'hug', 'hugs', 'user', 'Give somebody a hug.', cluster.config.general.wolke);
    }
}
