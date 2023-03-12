import type { Emote } from '@blargbot/discord-emote';

import type { BBTagContext } from '../BBTagContext.js';
import type { AwaitReactionsResponse, Entities } from '../types.js';

export interface MessageService {
    get(context: BBTagContext, channelId: string, messageId: string): Promise<Entities.Message | undefined>;
    delete(context: BBTagContext, channelId: string, messageId: string): Promise<void>;
    edit(context: BBTagContext, channelId: string, messageId: string, content: Partial<Entities.MessageCreateOptions>): Promise<void>;
    create(context: BBTagContext, channelId: string, content: Entities.MessageCreateOptions): Promise<Entities.Message | { error: string; } | undefined>;
    runWebhook(context: BBTagContext, webhookId: string, webhookToken: string, content: Entities.WebhookCreateOptions): Promise<undefined | { error: string; }>;

    addReactions(context: BBTagContext, channelId: string, messageId: string, reactions: Emote[]): Promise<{ success: Emote[]; failed: Emote[]; }>;
    removeReactions(context: BBTagContext, channelId: string, messageId: string): Promise<void>;
    removeReactions(context: BBTagContext, channelId: string, messageId: string, userId: string, reactions: Emote[]): Promise<{ success: Emote[]; failed: Emote[]; } | 'noPerms'>;
    getReactors(context: BBTagContext, channelId: string, messageId: string, reaction: Emote): Promise<string[] | 'unknownEmote'>;

    awaitReaction(context: BBTagContext, messages: string[], filter: (reaction: AwaitReactionsResponse) => Awaitable<boolean>, timeoutMs: number): Promise<AwaitReactionsResponse | undefined>;
    awaitMessage(context: BBTagContext, channels: string[], filter: (message: Entities.Message) => Awaitable<boolean>, timeoutMs: number): Promise<Entities.Message | undefined>;
}
