import type { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command/index.js';

import templates from '../../text.js';

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
