import type { BBTagRuntime } from '../BBTagRuntime.js';
import type { Entities } from '../types.js';
import type { EntityQueryService } from './EntityQueryService.js';

export interface RoleService extends EntityQueryService<Entities.Role> {
    create(context: BBTagRuntime, options: Entities.RoleCreate, reason?: string): Promise<Entities.Role | { error: string; }>;
    edit(context: BBTagRuntime, roleId: string, update: Partial<Entities.Role>, reason?: string): Promise<undefined | { error: string; }>;
    delete(context: BBTagRuntime, roleId: string, reason?: string): Promise<undefined | { error: string; }>;
}
