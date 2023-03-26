import type { Entities, ModLogService as BBTagModLogService } from '@bbtag/blargbot';
import type { ModLogMessageBroker } from '@blargbot/mod-log-client';

export class ModLogService implements BBTagModLogService {
    readonly #client: ModLogMessageBroker;

    public constructor(client: ModLogMessageBroker) {
        this.#client = client;
    }

    public async addModLog(guild: Entities.Guild, action: string, user: Entities.User, moderator?: Entities.User | undefined, reason?: string | undefined, colour?: number | undefined): Promise<void> {
        await this.#client.createModlog({
            guildId: BigInt(guild.id),
            type: action,
            users: [BigInt(user.id)],
            moderatorId: moderator === undefined ? undefined : BigInt(moderator.id),
            reason,
            metadata: colour === undefined ? undefined : {
                colour
            }
        });
    }
}
