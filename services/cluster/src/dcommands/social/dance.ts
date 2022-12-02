import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index.js';

import templates from '../../text.js';

export class DanceCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('dance', {
            search: 'dance',
            ...templates.commands.dance,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
