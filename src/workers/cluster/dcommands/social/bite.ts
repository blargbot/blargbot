import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class BiteCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('bite', {
            search: 'bite',
            action: 'bites',
            user: true,
            description: 'Give someone a bite!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
