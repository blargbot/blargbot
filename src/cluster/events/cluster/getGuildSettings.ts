import type { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster';

import { guildSettings } from '../../utils/index.js';

export class ClusterGetGuildSettingsHandler extends ClusterEventService<'getGuildSettings'> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, 'getGuildSettings', ({ reply }) => reply(guildSettings));
    }
}
