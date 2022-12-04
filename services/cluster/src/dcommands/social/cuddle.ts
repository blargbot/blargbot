import { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class CuddleCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('cuddle', {
            search: 'cuddle',
            user: true,
            ...templates.commands.cuddles,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
