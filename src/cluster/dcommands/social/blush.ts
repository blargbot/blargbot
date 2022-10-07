import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class BlushCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`blush`, {
            search: `blush`,
            ...templates.commands.blush,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
