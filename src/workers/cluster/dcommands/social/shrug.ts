import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class ShrugCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('shrug', 'shrug', 'shrugs', 'self', 'Let everyone know that you\'re a bit indifferent.', cluster.config.general.wolke);
    }
}
