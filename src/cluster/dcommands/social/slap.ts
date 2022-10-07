import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class SlapCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`slap`, {
            search: `slap`,
            user: true,
            ...templates.commands.slap,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
