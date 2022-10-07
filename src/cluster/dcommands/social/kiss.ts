import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class KissCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`kiss`, {
            search: `kiss`,
            user: true,
            ...templates.commands.kiss,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
