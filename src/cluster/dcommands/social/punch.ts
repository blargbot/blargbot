import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class PunchCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`punch`, {
            search: `punch`,
            user: true,
            ...templates.commands.punch,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
