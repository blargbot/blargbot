import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class BiteCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('bite', 'bite', 'bites', 'user', 'Give someone a bite!', cluster.config.general.wolke);
    }
}
