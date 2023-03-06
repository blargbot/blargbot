import type { BBTagContext, Entities, GuildService as BBTagGuildService } from '@bbtag/blargbot';
import type { Emote } from '@blargbot/discord-emote';

export class GuildService implements BBTagGuildService {
    public edit(context: BBTagContext, update: Partial<Entities.Guild>): Promise<{ error: string; } | undefined> {
        context;
        update;
        throw new Error('Method not implemented.');
    }
    public createEmote(context: BBTagContext, emote: Entities.CreateEmote, reason?: string | undefined): Promise<Emote | { error: string; }> {
        context;
        emote;
        reason;
        throw new Error('Method not implemented.');
    }
    public deleteEmote(context: BBTagContext, emoteId: string, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        context;
        emoteId;
        reason;
        throw new Error('Method not implemented.');
    }
}
