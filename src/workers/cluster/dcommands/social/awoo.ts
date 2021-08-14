import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class AwooCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('awoo', 'awoo', 'awoos', 'self', 'Awoooooooooo!', cluster.config.general.wolke);
    }
}
