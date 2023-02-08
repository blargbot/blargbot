import type { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class BangCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('bang', {
            search: 'bang',
            ...templates.commands.bang,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
