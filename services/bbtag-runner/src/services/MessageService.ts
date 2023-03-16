import type { AwaitReactionsResponse, BBTagRuntime, Entities, MessageService as BBTagMessageService } from '@bbtag/blargbot';
import type { Emote } from '@blargbot/discord-emote';

export class MessageService implements BBTagMessageService {
    public get(context: BBTagRuntime, channelId: string, messageId: string): Promise<Entities.Message | undefined> {
        context;
        channelId;
        messageId;
        throw new Error('Method not implemented.');
    }
    public delete(context: BBTagRuntime, channelId: string, messageId: string): Promise<void> {
        context;
        channelId;
        messageId;
        throw new Error('Method not implemented.');
    }
    public edit(context: BBTagRuntime, channelId: string, messageId: string, content: Partial<Entities.MessageCreateOptions>): Promise<void> {
        context;
        channelId;
        messageId;
        content;
        throw new Error('Method not implemented.');
    }
    public create(context: BBTagRuntime, channelId: string, content: Entities.MessageCreateOptions): Promise<Entities.Message | { error: string; } | undefined> {
        context;
        channelId;
        content;
        throw new Error('Method not implemented.');
    }
    public runWebhook(context: BBTagRuntime, webhookId: string, webhookToken: string, content: Entities.WebhookCreateOptions): Promise<{ error: string; } | undefined> {
        context;
        webhookId;
        webhookToken;
        content;
        throw new Error('Method not implemented.');
    }
    public addReactions(context: BBTagRuntime, channelId: string, messageId: string, reactions: Emote[]): Promise<{ success: Emote[]; failed: Emote[]; }> {
        context;
        channelId;
        messageId;
        reactions;
        throw new Error('Method not implemented.');
    }
    public removeReactions(context: BBTagRuntime, channelId: string, messageId: string): Promise<void>;
    public removeReactions(context: BBTagRuntime, channelId: string, messageId: string, userId: string, reactions: Emote[]): Promise<'noPerms' | { success: Emote[]; failed: Emote[]; }>;
    public removeReactions(context: BBTagRuntime, channelId: string, messageId: string, userId?: string, reactions?: Emote[]): Promise<void> | Promise<'noPerms' | { success: Emote[]; failed: Emote[]; }> {
        context;
        channelId;
        messageId;
        userId;
        reactions;
        throw new Error('Method not implemented.');
    }
    public getReactors(context: BBTagRuntime, channelId: string, messageId: string, reaction: Emote): Promise<string[] | 'unknownEmote'> {
        context;
        channelId;
        messageId;
        reaction;
        throw new Error('Method not implemented.');
    }
    public awaitReaction(context: BBTagRuntime, messages: string[], filter: (reaction: AwaitReactionsResponse) => Awaitable<boolean>, timeoutMs: number): Promise<AwaitReactionsResponse | undefined> {
        context;
        messages;
        filter;
        timeoutMs;
        throw new Error('Method not implemented.');
    }
    public awaitMessage(context: BBTagRuntime, channels: string[], filter: (message: Entities.Message) => Awaitable<boolean>, timeoutMs: number): Promise<Entities.Message | undefined> {
        context;
        channels;
        filter;
        timeoutMs;
        throw new Error('Method not implemented.');
    }
}
