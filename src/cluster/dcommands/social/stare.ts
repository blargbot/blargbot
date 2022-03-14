import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

export class StareCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('stare', {
            search: 'stare',
            action: 'stares',
            description: 'Staaaaaaaaare',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
