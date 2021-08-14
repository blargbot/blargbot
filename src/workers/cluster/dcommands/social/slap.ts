import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class SlapCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('slap', 'slap', 'slaps', 'user', 'Slaps someone.', cluster.config.general.wolke);
    }
}
