import type { Entities, ModLogService as BBTagModLogService } from '@bbtag/blargbot';

export class ModLogService implements BBTagModLogService {
    public addModLog(guild: Entities.Guild, action: string, user: Entities.User, moderator?: Entities.User | undefined, reason?: string | undefined, color?: number | undefined): Promise<void> {
        guild;
        action;
        user;
        moderator;
        reason;
        color;
        throw new Error('Method not implemented.');
    }
}
