import { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class SmugCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('smug', {
            search: 'smug',
            ...templates.commands.smug,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
