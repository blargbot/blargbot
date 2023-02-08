import type { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class StareCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('stare', {
            search: 'stare',
            ...templates.commands.stare,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
