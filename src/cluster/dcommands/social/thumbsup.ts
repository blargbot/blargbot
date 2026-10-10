import type { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster';

import { templates } from '../../text.js';

export class ThumbsUpCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('thumbsup', {
            search: 'thumbsup',
            ...templates.commands.thumbsUp,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
