import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class PokeCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('poke', {
            search: 'poke',
            user: true,
            ...templates.commands.poke,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
