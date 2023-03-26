import type { BBTagRuntime, Entities, WarningService as BBTagWarningService } from '@bbtag/blargbot';
import type { UserWarningsHttpClient } from '@blargbot/user-warnings-client';

export class WarningService implements BBTagWarningService {
    readonly #client: UserWarningsHttpClient;

    public constructor(client: UserWarningsHttpClient) {
        this.#client = client;
    }

    public async warn(context: BBTagRuntime, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number> {
        const result = await this.#client.assignWarnings({
            guildId: context.guild.id,
            userId: member.id,
            assign: count,
            moderator: BigInt(moderator.id),
            reason
        });
        return result.newCount;
    }

    public async pardon(context: BBTagRuntime, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number> {
        const result = await this.#client.assignWarnings({
            guildId: context.guild.id,
            userId: member.id,
            assign: -count,
            moderator: BigInt(moderator.id),
            reason
        });
        return result.newCount;
    }

    public async count(context: BBTagRuntime, member: Entities.User): Promise<number> {
        const result = await this.#client.getWarnings({ guildId: context.guild.id, userId: member.id });
        return result.count;
    }
}
