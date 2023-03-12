import type { BBTagContext, Entities, WarningService as BBTagWarningService } from '@bbtag/blargbot';
import type { UserWarningsHttpClient } from '@blargbot/user-warnings-client';

export class WarningService implements BBTagWarningService {
    readonly #client: UserWarningsHttpClient;

    public constructor(client: UserWarningsHttpClient) {
        this.#client = client;
    }

    public async warn(context: BBTagContext, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number> {
        const result = await this.#client.assignWarnings({ guildId: context.guild.id, userId: member.id, assign: count });
        // TODO Send message to modlog
        moderator;
        reason;
        return result.newCount;
    }

    public async pardon(context: BBTagContext, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number> {
        const result = await this.#client.assignWarnings({ guildId: context.guild.id, userId: member.id, assign: -count });
        // TODO Send message to modlog
        moderator;
        reason;
        return result.newCount;
    }

    public async count(context: BBTagContext, member: Entities.User): Promise<number> {
        const result = await this.#client.getWarnings({ guildId: context.guild.id, userId: member.id });
        return result.count;
    }
}
