import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class PatCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`pat`, {
            search: `pat`,
            user: true,
            ...templates.commands.pat,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
