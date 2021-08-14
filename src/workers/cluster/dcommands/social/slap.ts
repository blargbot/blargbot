import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class SlapCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('slap', {
            search: 'slap',
            action: 'slaps',
            user: true,
            description: 'Slaps someone.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
