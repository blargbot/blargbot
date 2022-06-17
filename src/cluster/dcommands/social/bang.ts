import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class BangCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('bang', {
            search: 'bang',
            action: 'bangs',
            description: 'Bang bang!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
