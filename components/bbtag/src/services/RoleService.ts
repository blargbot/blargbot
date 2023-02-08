import type { BBTagContext } from '../BBTagContext.js';
import type { Entities } from '../types.js';
import type { EntityQueryService } from './EntityQueryService.js';

export interface RoleService extends EntityQueryService<Entities.Role> {
    create(context: BBTagContext, options: Entities.RoleCreate, reason?: string): Promise<Entities.Role | { error: string; }>;
    edit(context: BBTagContext, roleId: string, update: Partial<Entities.Role>, reason?: string): Promise<undefined | { error: string; }>;
    delete(context: BBTagContext, roleId: string, reason?: string): Promise<undefined | { error: string; }>;
}
