import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class RemCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('rem', {
            search: 'rem',
            description: 'Worst girl.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
