import { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class BlushCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('blush', {
            search: 'blush',
            ...templates.commands.blush,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
