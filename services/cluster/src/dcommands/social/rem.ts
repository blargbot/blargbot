import type { Cluster } from '@blargbot/cluster';

import { WolkenCommand } from '../../command/index.js';
import templates from '../../text.js';

export class RemCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('rem', {
            search: 'rem',
            ...templates.commands.rem,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
