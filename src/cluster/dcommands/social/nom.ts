import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class NomCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('nom', {
            search: 'nom',
            user: true,
            ...templates.commands.nom,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
