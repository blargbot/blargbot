import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class MeguminCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('megumin', {
            search: 'megumin',
            ...templates.commands.megumin,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
