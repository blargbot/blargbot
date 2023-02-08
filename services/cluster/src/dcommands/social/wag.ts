import type { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class WagCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('wag', {
            search: 'wag',
            ...templates.commands.wag,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
