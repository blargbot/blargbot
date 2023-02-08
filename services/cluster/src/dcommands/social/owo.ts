import type { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class OwoCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('owo', {
            search: 'owo',
            ...templates.commands.owo,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
