import type { BBTagContext, Entities, FindEntityOptions, RoleService as BBTagRoleService } from '@bbtag/blargbot';

export class RoleService implements BBTagRoleService {
    public create(context: BBTagContext, options: Entities.RoleCreate, reason?: string | undefined): Promise<Entities.Role | { error: string; }> {
        context;
        options;
        reason;
        throw new Error('Method not implemented.');
    }
    public edit(context: BBTagContext, roleId: string, update: Partial<Entities.Role>, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        context;
        roleId;
        update;
        reason;
        throw new Error('Method not implemented.');
    }
    public delete(context: BBTagContext, roleId: string, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        context;
        roleId;
        reason;
        throw new Error('Method not implemented.');
    }
    public querySingle(context: BBTagContext, query: string, options?: FindEntityOptions | undefined): Promise<Entities.Role | undefined> {
        context;
        query;
        options;
        throw new Error('Method not implemented.');
    }
}
