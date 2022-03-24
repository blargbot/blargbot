import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class ShrugCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('shrug', {
            search: 'shrug',
            action: 'shrugs',
            description: 'Let everyone know that you\'re a bit indifferent.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
