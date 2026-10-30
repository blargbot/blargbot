import type { Cluster } from '@blargbot/cluster';
import { WolkenCommand } from '@blargbot/cluster';

import { templates } from '../../text.js';

export class PunchCommand extends WolkenCommand {
    public constructor(cluster: Cluster) {
        super('punch', {
            search: 'punch',
            user: true,
            ...templates.commands.punch,
            wolkeKey: cluster.config.general.wolke
        });
    }
}
