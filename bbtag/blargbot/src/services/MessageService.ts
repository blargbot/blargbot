import type { Emote } from '@blargbot/discord-emote';

import type { BBTagRuntime } from '../BBTagRuntime.js';
import type { AwaitReactionsResponse, Entities } from '../types.js';

export interface MessageService {
    get(context: BBTagRuntime, channelId: string, messageId: string): Promise<Entities.Message | undefined>;
    delete(context: BBTagRuntime, channelId: string, messageId: string): Promise<void>;
    edit(context: BBTagRuntime, channelId: string, messageId: string, content: Partial<Entities.MessageCreateOptions>): Promise<void>;
    create(context: BBTagRuntime, channelId: string, content: Entities.MessageCreateOptions): Promise<Entities.Message | { error: string; } | undefined>;
    runWebhook(context: BBTagRuntime, webhookId: string, webhookToken: string, content: Entities.WebhookCreateOptions): Promise<undefined | { error: string; }>;

    addReactions(context: BBTagRuntime, channelId: string, messageId: string, reactions: Emote[]): Promise<{ success: Emote[]; failed: Emote[]; }>;
    removeReactions(context: BBTagRuntime, channelId: string, messageId: string): Promise<void>;
    removeReactions(context: BBTagRuntime, channelId: string, messageId: string, userId: string, reactions: Emote[]): Promise<{ success: Emote[]; failed: Emote[]; } | 'noPerms'>;
    getReactors(context: BBTagRuntime, channelId: string, messageId: string, reaction: Emote): Promise<string[] | 'unknownEmote'>;

    awaitReaction(context: BBTagRuntime, messages: string[], filter: (reaction: AwaitReactionsResponse) => Awaitable<boolean>, timeoutMs: number): Promise<AwaitReactionsResponse | undefined>;
    awaitMessage(context: BBTagRuntime, channels: string[], filter: (message: Entities.Message) => Awaitable<boolean>, timeoutMs: number): Promise<Entities.Message | undefined>;
}
