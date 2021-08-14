import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class CuddleCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('cuddle', {
            search: 'cuddle',
            action: 'cuddles with',
            user: true,
            description: 'Cuddle with someone.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
