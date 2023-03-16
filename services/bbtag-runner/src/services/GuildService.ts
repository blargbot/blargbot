import type { BBTagRuntime, Entities, GuildService as BBTagGuildService } from '@bbtag/blargbot';
import type { Emote } from '@blargbot/discord-emote';

export class GuildService implements BBTagGuildService {
    public edit(context: BBTagRuntime, update: Partial<Entities.Guild>): Promise<{ error: string; } | undefined> {
        context;
        update;
        throw new Error('Method not implemented.');
    }
    public createEmote(context: BBTagRuntime, emote: Entities.CreateEmote, reason?: string | undefined): Promise<Emote | { error: string; }> {
        context;
        emote;
        reason;
        throw new Error('Method not implemented.');
    }
    public deleteEmote(context: BBTagRuntime, emoteId: string, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        context;
        emoteId;
        reason;
        throw new Error('Method not implemented.');
    }
}
