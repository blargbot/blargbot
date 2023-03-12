import type { BBTagContext } from '../BBTagContext.js';
import type { Entities } from '../types.js';
import type { EntityFetchService } from './EntityFetchService.js';
import type { EntityQueryService } from './EntityQueryService.js';

export interface UserService extends EntityQueryService<Entities.User>, EntityFetchService<Entities.User, string> {
    findBanned(context: BBTagContext): Promise<string[] | 'noPerms'>;
    edit(context: BBTagContext, userId: string, update: Partial<Entities.Member>, reason?: string): Promise<void>;

    ban(guild: Entities.Guild, user: Entities.User, moderator: Entities.User, authorizer: Entities.User, deleteDays: number, reason: string, durationMs: number): Promise<'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    unban(guild: Entities.Guild, user: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string): Promise<'success' | 'notBanned' | 'noPerms' | 'moderatorNoPerms'>;
    kick(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string): Promise<'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    mute(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, durationMs: number, reason?: string): Promise<'success' | 'alreadyTimedOut' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'>;
    unmute(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string): Promise<'success' | 'notTimedOut' | 'noPerms' | 'moderatorNoPerms'>;
}
