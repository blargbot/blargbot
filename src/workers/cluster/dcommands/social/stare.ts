import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class StareCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('stare', 'stare', 'stares', 'self', 'Staaaaaaaaare', cluster.config.general.wolke);
    }
}
