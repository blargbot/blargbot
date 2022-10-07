import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class LewdCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`lewd`, {
            search: `lewd`,
            ...templates.commands.lewd,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
