import type { BBTagRuntime, Entities, FindEntityOptions, UserService as BBTagUserService } from '@bbtag/blargbot';

export class UserService implements BBTagUserService {
    public findBanned(context: BBTagRuntime): Promise<string[] | 'noPerms'> {
        context;
        throw new Error('Method not implemented.');
    }
    public edit(context: BBTagRuntime, userId: string, update: Partial<Entities.Member>, reason?: string | undefined): Promise<void> {
        context;
        userId;
        update;
        reason;
        throw new Error('Method not implemented.');
    }
    public ban(guild: Entities.Guild, user: Entities.User, moderator: Entities.User, authorizer: Entities.User, deleteDays: number, reason: string, durationMs: number): Promise<'noPerms' | 'success' | 'alreadyBanned' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        guild;
        user;
        moderator;
        authorizer;
        deleteDays;
        reason;
        durationMs;
        throw new Error('Method not implemented.');
    }
    public unban(guild: Entities.Guild, user: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string | undefined): Promise<'noPerms' | 'success' | 'moderatorNoPerms' | 'notBanned'> {
        guild;
        user;
        moderator;
        authorizer;
        reason;
        throw new Error('Method not implemented.');
    }
    public kick(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string | undefined): Promise<'noPerms' | 'success' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        member;
        moderator;
        authorizer;
        reason;
        throw new Error('Method not implemented.');
    }
    public mute(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, durationMs: number, reason?: string | undefined): Promise<'noPerms' | 'success' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow' | 'alreadyTimedOut'> {
        member;
        moderator;
        authorizer;
        durationMs;
        reason;
        throw new Error('Method not implemented.');
    }
    public unmute(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string | undefined): Promise<'noPerms' | 'success' | 'moderatorNoPerms' | 'notTimedOut'> {
        member;
        moderator;
        authorizer;
        reason;
        throw new Error('Method not implemented.');
    }
    public querySingle(context: BBTagRuntime, query: string, options?: FindEntityOptions | undefined): Promise<Entities.User | undefined> {
        context;
        query;
        options;
        throw new Error('Method not implemented.');
    }
    public get(context: BBTagRuntime, id: string): Promise<Entities.User | undefined> {
        context;
        id;
        throw new Error('Method not implemented.');
    }
    public getAll(context: BBTagRuntime): Promise<Entities.User[]> {
        context;
        throw new Error('Method not implemented.');
    }
}
