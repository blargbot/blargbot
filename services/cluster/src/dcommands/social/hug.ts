import { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class HugCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('hug', {
            search: 'hug',
            ...templates.commands.hug,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
