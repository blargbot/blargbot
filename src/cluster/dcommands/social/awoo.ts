import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class AwooCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('awoo', {
            search: 'awoo',
            action: 'awoos',
            description: 'Awoooooooooo!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
