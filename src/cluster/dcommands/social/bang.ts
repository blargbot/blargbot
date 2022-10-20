import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class BangCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('bang', {
            search: 'bang',
            ...templates.commands.bang,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
