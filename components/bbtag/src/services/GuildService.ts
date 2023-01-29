import type { Emote } from '@blargbot/discord-emote';

import type { BBTagContext } from '../BBTagContext.js';
import type { Entities } from '../types.js';

export interface GuildService {
    edit(context: BBTagContext, update: Partial<Entities.Guild>): Promise<undefined | { error: string; }>;

    createEmote(context: BBTagContext, emote: Entities.CreateEmote, reason?: string): Promise<Emote | { error: string; }>;
    deleteEmote(context: BBTagContext, emoteId: string, reason?: string): Promise<undefined | { error: string; }>;
}
