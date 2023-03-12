import type { BBTagContext } from '../BBTagContext.js';
import type { Entities } from '../types.js';

export interface WarningService {
    warn(context: BBTagContext, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number>;
    pardon(context: BBTagContext, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number>;
    count(context: BBTagContext, member: Entities.User): Promise<number>;
}
