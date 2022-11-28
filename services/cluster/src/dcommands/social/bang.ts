import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

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
