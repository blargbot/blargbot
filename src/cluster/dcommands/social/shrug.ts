import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class ShrugCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('shrug', {
            search: 'shrug',
            action: 'shrugs',
            description: 'Let everyone know that you\'re a bit indifferent.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
