import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

export class CryCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('cry', {
            search: 'cry',
            ...templates.commands.cry,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
