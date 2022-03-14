import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class KissCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('kiss', {
            search: 'kiss',
            action: 'kisses',
            user: true,
            description: 'Give someone a kiss!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
