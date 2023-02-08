import type { BBTagContext } from '../BBTagContext.js';
import type { Entities } from '../types.js';
import type { EntityFetchService } from './EntityFetchService.js';
import type { EntityQueryService } from './EntityQueryService.js';

export interface UserService extends EntityQueryService<Entities.User>, EntityFetchService<Entities.User, string> {
    findBanned(context: BBTagContext): Promise<string[] | 'noPerms'>;
    edit(context: BBTagContext, userId: string, update: Partial<Entities.Member>, reason?: string): Promise<void>;
}
