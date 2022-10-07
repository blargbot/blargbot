import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class WagCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`wag`, {
            search: `wag`,
            ...templates.commands.wag,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
