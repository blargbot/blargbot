import { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class MeguminCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('megumin', {
            search: 'megumin',
            ...templates.commands.megumin,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
