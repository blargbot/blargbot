import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index.js';

import templates from '../../text.js';

export class LewdCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('lewd', {
            search: 'lewd',
            ...templates.commands.lewd,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
