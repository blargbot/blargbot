import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

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
