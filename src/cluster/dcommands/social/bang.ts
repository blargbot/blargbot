import type { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster';

import { templates } from '../../text.js';

export class BangCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('bang', {
            search: 'bang',
            ...templates.commands.bang,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
