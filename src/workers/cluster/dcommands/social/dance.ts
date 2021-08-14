import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class DanceCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('dance', 'dance', 'dances', 'self', 'Break out some sweet, sweet dance moves.', cluster.config.general.wolke);
    }
}
