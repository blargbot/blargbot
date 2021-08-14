import { Cluster } from '@cluster';
import { BaseSocialWolkeCommand } from '@cluster/command';

export class NomCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('nom', 'nom', 'noms on', 'user', 'Nom on somebody.', cluster.config.general.wolke);
    }
}
