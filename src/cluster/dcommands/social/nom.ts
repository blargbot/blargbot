import { Cluster } from '@blargbot/cluster';
import { BaseSocialWolkeCommand } from '@blargbot/cluster/command';

export class NomCommand extends BaseSocialWolkeCommand {
    public constructor(cluster: Cluster) {
        super('nom', {
            search: 'nom',
            action: 'noms on',
            user: true,
            description: 'Nom on somebody.',
            wolkeKey: cluster.config.general.wolke
        });
    }
}
