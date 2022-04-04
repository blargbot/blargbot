import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class LickCommand extends WolkenCommand {
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
