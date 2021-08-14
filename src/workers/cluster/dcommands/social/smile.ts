import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class SmileCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('smile', {
            search: 'smile',
            action: 'smiles',
            description: 'Smile!',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
