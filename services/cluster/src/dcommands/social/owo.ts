import { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '../../command/index';

import templates from '../../text';

export class OwoCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('owo', {
            search: 'owo',
            ...templates.commands.owo,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
