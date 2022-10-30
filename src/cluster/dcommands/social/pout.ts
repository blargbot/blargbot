import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class PoutCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('pout', {
            search: 'pout',
            ...templates.commands.pout,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
