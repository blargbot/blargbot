import type { BBTagContext, Entities, GuildService } from '@blargbot/bbtag';
import { catchErrors } from '@blargbot/catch-decorators';
import { Emote } from '@blargbot/discord-emote';
import * as Eris from 'eris';

import type { Cluster } from '../../Cluster.js';

const catchErisRestErrors = catchErrors.async(Eris.DiscordRESTError, err => {
    const parts = err.message.split('\n').map(m => m.trim());
    return { error: parts[1] ?? parts[0] };
});

export class ErisBBTagGuildService implements GuildService {
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        this.#cluster = cluster;
    }

    @catchErisRestErrors
    public async edit(context: BBTagContext, update: Partial<Entities.Guild>): Promise<{ error: string; } | undefined> {
        const { banner, description, features, icon, splash, ...opts } = update;
        await this.#cluster.discord.editGuild(context.guild.id, {
            ...opts,
            description: description ?? undefined,
            banner: banner ?? undefined,
            features: features as undefined | Eris.GuildFeatures[],
            icon: icon ?? undefined,
            splash: splash ?? undefined
        }, context.auditReason());
        return undefined;
    }

    @catchErisRestErrors
    public async createEmote(context: BBTagContext, emote: Entities.CreateEmote, reason?: string | undefined): Promise<Emote | { error: string; }> {
        const result = await this.#cluster.discord.createGuildEmoji(context.guild.id, emote, reason ?? context.auditReason());
        return new Emote(result.name, BigInt(result.id), result.animated);
    }

    @catchErisRestErrors
    public async deleteEmote(context: BBTagContext, emoteId: string, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        await this.#cluster.discord.deleteGuildEmoji(context.guild.id, emoteId, reason ?? context.auditReason());
        return undefined;
    }

}
