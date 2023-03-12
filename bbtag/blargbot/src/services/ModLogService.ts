import type { Entities } from '../types.js';

export interface ModLogService {
    addModLog(guild: Entities.Guild, action: string, user: Entities.User, moderator?: Entities.User, reason?: string, color?: number): Promise<void>;
}
