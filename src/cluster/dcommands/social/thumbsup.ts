import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command';

import templates from '../../text';

export class ThumbsUpCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super(`thumbsup`, {
            search: `thumbsup`,
            ...templates.commands.thumbsUp,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
