import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

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
