import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class SmileCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('smile', 'smile', 'smiles', 'self', 'Smile!', cluster.config.general.wolke);
    }
}
