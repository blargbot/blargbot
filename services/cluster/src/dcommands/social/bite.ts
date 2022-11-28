import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

export class BiteCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('bite', {
            search: 'bite',
            user: true,
            ...templates.commands.bite,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
