import type { BBTagContext, ChannelService as BBTagChannelService, Entities, FindEntityOptions } from '@bbtag/blargbot';

export class ChannelService implements BBTagChannelService {
    public getDmChannelId(context: BBTagContext, userId: string): Promise<string> {
        context;
        userId;
        throw new Error('Method not implemented.');
    }
    public edit(context: BBTagContext, channelId: string, update: Partial<Entities.EditChannel>, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        context;
        channelId;
        update;
        reason;
        throw new Error('Method not implemented.');
    }
    public delete(context: BBTagContext, channelId: string, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        context;
        channelId;
        reason;
        throw new Error('Method not implemented.');
    }
    public create(context: BBTagContext, options: Entities.CreateChannel, reason?: string | undefined): Promise<Entities.Channel | { error: string; }> {
        context;
        options;
        reason;
        throw new Error('Method not implemented.');
    }
    public setPermission(context: BBTagContext, channelId: string, overwrite: Entities.PermissionOverwrite, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        context;
        channelId;
        overwrite;
        reason;
        throw new Error('Method not implemented.');
    }
    public querySingle(context: BBTagContext, query: string, options?: FindEntityOptions | undefined): Promise<Entities.Channel | undefined> {
        context;
        query;
        options;
        throw new Error('Method not implemented.');
    }
    public get(context: BBTagContext, id: string): Promise<Entities.Channel | undefined> {
        context;
        id;
        throw new Error('Method not implemented.');
    }
    public getAll(context: BBTagContext): Promise<Entities.Channel[]> {
        context;
        throw new Error('Method not implemented.');
    }
}
