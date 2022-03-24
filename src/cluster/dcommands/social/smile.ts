import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class SmileCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('smile', {
            search: 'smile',
            action: 'smiles',
            description: 'Smile!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
