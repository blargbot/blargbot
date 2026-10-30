import type { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster';

import { templates } from '../../text.js';

export class JojoCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('jojo', {
            search: 'jojo',
            ...templates.commands.jojo,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
