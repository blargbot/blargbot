import type { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster/command/index.js';

import templates from '../../text.js';

export class SmileCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('smile', {
            search: 'smile',
            ...templates.commands.smile,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
