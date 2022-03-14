import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

export class RemCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('rem', {
            search: 'rem',
            description: 'Worst girl.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
