import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class LickCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('lick', {
            search: 'lick',
            action: 'licks',
            user: true,
            description: 'Give someone a lick. Sluurrpppp!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
