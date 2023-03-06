import type { Entities, ModLogService } from '@bbtag/blargbot';
import { util } from '@blargbot/formatting';

import type { Cluster } from '../../Cluster.js';

export class ClusterModlogService implements ModLogService {

    public constructor(public readonly cluster: Cluster) {
    }
    public addModLog(guild: Entities.Guild, action: string, user: Entities.User, moderator?: Entities.User, reason?: string, color?: number): Promise<void> {
        // @ts-expect-error This is only a reference file for now
        return this.cluster.moderation.modLog.logCustom(guild, util.literal(action), user, moderator, util.literal(reason), color);
    }
}
