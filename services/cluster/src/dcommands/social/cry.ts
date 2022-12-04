import { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class CryCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('cry', {
            search: 'cry',
            ...templates.commands.cry,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
