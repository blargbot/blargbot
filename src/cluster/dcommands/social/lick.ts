import type { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster';

import { templates } from '../../text.js';

export class LickCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('lick', {
            search: 'lick',
            user: true,
            ...templates.commands.lick,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
