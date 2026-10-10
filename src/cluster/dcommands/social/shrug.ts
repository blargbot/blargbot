import type { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster';

import { templates } from '../../text.js';

export class ShrugCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('shrug', {
            search: 'shrug',
            ...templates.commands.shrug,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
