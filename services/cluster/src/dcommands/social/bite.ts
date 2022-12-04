import { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class BiteCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('bite', {
            search: 'bite',
            user: true,
            ...templates.commands.bite,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
