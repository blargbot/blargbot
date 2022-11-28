import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

export class StareCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('stare', {
            search: 'stare',
            ...templates.commands.stare,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
