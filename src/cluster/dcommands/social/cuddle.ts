import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class CuddleCommand extends WolkenCommand {
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
