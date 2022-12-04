import { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

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
