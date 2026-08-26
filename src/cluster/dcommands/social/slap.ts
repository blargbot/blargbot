import type { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command/index.js';

import templates from '../../text.js';

export class SlapCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('slap', {
            search: 'slap',
            user: true,
            ...templates.commands.slap,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
