import type { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class PatCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('pat', {
            search: 'pat',
            user: true,
            ...templates.commands.pat,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
