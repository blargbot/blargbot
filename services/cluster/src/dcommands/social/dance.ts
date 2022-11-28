import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

export class DanceCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('dance', {
            search: 'dance',
            ...templates.commands.dance,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
