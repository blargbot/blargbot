import { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class KissCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('kiss', {
            search: 'kiss',
            user: true,
            ...templates.commands.kiss,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
