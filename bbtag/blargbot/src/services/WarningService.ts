import type { BBTagRuntime } from '../BBTagRuntime.js';
import type { Entities } from '../types.js';

export interface WarningService {
    warn(context: BBTagRuntime, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number>;
    pardon(context: BBTagRuntime, member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number>;
    count(context: BBTagRuntime, member: Entities.User): Promise<number>;
}
