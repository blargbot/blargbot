import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

export class NomCommand extends WolkenCommand {
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
