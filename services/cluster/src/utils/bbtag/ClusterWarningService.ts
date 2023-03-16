import type { BBTagRuntime, Entities, WarningService } from '@bbtag/blargbot';
import { util } from '@blargbot/formatting';

import type { Cluster } from '../../Cluster.js';

export class ClusterWarningService implements WarningService {

    public constructor(public readonly cluster: Cluster) {
    }

    public async count(context: BBTagRuntime, member: Entities.User): Promise<number> {
        return await this.cluster.database.guilds.getWarnings(context.guild.id, member.id) ?? 0;
    }

    public async warn(ctx: BBTagRuntime, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number> {
        ctx;
        // @ts-expect-error This is only a reference file for now
        const result = await this.cluster.moderation.warns.warn(member, moderator, this.cluster.discord.user, count, util.literal(reason));
        return result.warnings;
    }

    public async pardon(ctx: BBTagRuntime, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number> {
        ctx;
        // @ts-expect-error This is only a reference file for now
        const result = await this.cluster.moderation.warns.pardon(member, moderator, count, util.literal(reason));
        return result.warnings;
    }
}
