import type { Emote } from '@blargbot/discord-emote';

import type { BBTagRuntime } from '../BBTagRuntime.js';
import type { Entities } from '../types.js';

export interface GuildService {
    edit(context: BBTagRuntime, update: Partial<Entities.Guild>): Promise<undefined | { error: string; }>;

    createEmote(context: BBTagRuntime, emote: Entities.CreateEmote, reason?: string): Promise<Emote | { error: string; }>;
    deleteEmote(context: BBTagRuntime, emoteId: string, reason?: string): Promise<undefined | { error: string; }>;
}
