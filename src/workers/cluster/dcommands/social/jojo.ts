import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class JojoCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('jojo', 'jojo', undefined, 'none', 'This must be the work of an enemy stand!', cluster.config.general.wolke);
    }
}
