import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

export class AwooCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('awoo', {
            search: 'awoo',
            action: 'awoos',
            description: 'Awoooooooooo!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
