import type { BBTagContext, Entities, EntityQueryService, FindEntityOptions, RoleService } from '@blargbot/bbtag';
import { catchErrors } from '@blargot/catch-decorators';
import * as Eris from 'eris';

import type { Cluster } from '../../Cluster.js';
import { createEntityQueryService } from './createEntityQueryService.js';
import { createCancelledAlerter, createNotFoundAlerter } from './defaultAlerts.js';

export const catchErisRESTErrors = catchErrors.async(Eris.DiscordRESTError, err => ({ error: err.message }));

export class ErisBBTagRoleService implements RoleService {
    readonly #cluster: Cluster;
    readonly #querySingle: EntityQueryService<Entities.Role>['querySingle'];

    public constructor(cluster: Cluster) {
        this.#cluster = cluster;
        this.#querySingle = createEntityQueryService({
            cacheKey: 'role',
            find: (query, ctx) => cluster.util.findRoles(ctx.guild.id, query),
            getById: (id, ctx) => cluster.util.getRole(ctx.guild.id, id),
            getId: c => c.id,
            pickBest: (choices, query, ctx) => cluster.util.queryRole({ actors: ctx.user.id, context: ctx.channel, choices, filter: query }),
            alertCancelled: createCancelledAlerter('role'),
            alertNotFound: createNotFoundAlerter('role'),
            getResult: this.#convertToRole.bind(this)
        });

    }

    #convertToRole(channel: Eris.Role): Entities.Role {
    }

    @catchErisRESTErrors
    public async create(context: BBTagContext, options: Entities.RoleCreate, reason?: string | undefined): Promise<Entities.Role | { error: string; }> {
        const entity = await this.#cluster.discord.createRole(context.guild.id, options, reason ?? context.auditReason());
        return this.#convertToRole(entity);
    }

    @catchErisRESTErrors
    public async edit(context: BBTagContext, roleId: string, update: Partial<Entities.Role>, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        const { icon, ...rest } = update;
        await this.#cluster.discord.editRole(context.guild.id, roleId, {
            ...rest,
            icon: icon ?? undefined
        }, reason ?? context.auditReason());
        return undefined;
    }

    @catchErisRESTErrors
    public async delete(context: BBTagContext, roleId: string, reason?: string | undefined): Promise<{ error: string; } | undefined> {
        await this.#cluster.discord.deleteRole(context.guild.id, roleId, reason ?? context.auditReason());
        return undefined;
    }

    public async querySingle(context: BBTagContext, query: string, options?: FindEntityOptions | undefined): Promise<Entities.Role | undefined> {
        return await this.#querySingle(context, query, options);
    }

}
