import type { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster';

import { templates } from '../../text.js';

export class RemCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('rem', {
            search: 'rem',
            ...templates.commands.rem,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
