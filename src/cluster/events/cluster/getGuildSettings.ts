import { Cluster } from '@blargbot/cluster';
import { ClusterEventService } from '@blargbot/cluster/serviceTypes';

import { guildSettings } from '../../utils';

export class ClusterGetGuildSettingsHandler extends ClusterEventService<`getGuildSettings`> {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, `getGuildSettings`, ({ reply }) => reply(guildSettings));
    }
}
