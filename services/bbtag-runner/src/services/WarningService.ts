import type { BBTagContext, Entities, WarningService as BBTagWarningService } from '@bbtag/blargbot';

export class WarningService implements BBTagWarningService {
    public warn(context: BBTagContext, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number> {
        context;
        member;
        moderator;
        count;
        reason;
        throw new Error('Method not implemented.');
    }

    public pardon(context: BBTagContext, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number> {
        context;
        member;
        moderator;
        count;
        reason;
        throw new Error('Method not implemented.');
    }

    public count(context: BBTagContext, member: Entities.User): Promise<number> {
        context;
        member;
        throw new Error('Method not implemented.');
    }
}
// {
//     count: async (ctx, user) => await this.database.guilds.getWarnings(ctx.guild.id, user.id) ?? 0,
//     pardon: (...args) => util.pardon(...args),
//     warn: (...args) => util.warn(...args)
// }
