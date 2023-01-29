import type { BBTagContext, Entities } from '@blargbot/bbtag';
import type { ChannelProvider } from '@blargbot/bbtag/services/ChannelProvider.js';
import { FuzzyQueryService } from '@blargbot/bbtag/services/IQueryService.js';
import type { RoleProvider } from '@blargbot/bbtag/services/RoleProvider.js';
import type { UserService } from '@blargbot/bbtag/services/UserProvider.js';
import type * as Eris from 'eris';

import type { Cluster } from '../../Cluster.js';

export class ErisChannelProvider extends FuzzyQueryService<Eris.KnownGuildChannel, Entities.Channel, 'channel'> implements ChannelProvider {
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        super({
            cacheKey: 'channel',
            find: (query, ctx) => cluster.util.findChannels(ctx.guild, query),
            getById: (id, ctx) => cluster.util.getChannel(ctx.guild, id),
            getId: c => c.id,
            pickBest: (choices, query, ctx) => cluster.util.queryChannel({ actors: ctx.user, context: ctx.channel, choices, filter: query }),
            alertCancelled: FuzzyQueryService.cancelled('channel'),
            alertNotFound: FuzzyQueryService.notFound('channel'),
            getResult: c => c.toJSON() as unknown as Entities.Channel
        });

        this.#cluster = cluster;
    }

    public async getDmChannelId(_context: BBTagContext, userId: string): Promise<string> {
        const channel = await this.#cluster.discord.getDMChannel(userId);
        return channel.id;
    }

    public async edit(context: BBTagContext, channelId: string, update: Partial<Entities.EditChannel>, reason?: string): Promise<void> {
        await this.#cluster.discord.editChannel(channelId, update, reason ?? context.auditReason());
    }

    public async delete(context: BBTagContext, channelId: string, reason?: string): Promise<void> {
        await this.#cluster.discord.deleteChannel(channelId, reason ?? context.auditReason());
    }

    public async create(context: BBTagContext, options: Entities.CreateChannel, reason?: string): Promise<Entities.Channel> {
        const { name, type, permissionOverwrites, ...config } = options;
        const channel = await this.#cluster.discord.createChannel(context.guild.id, name, type, reason ?? context.auditReason(), {
            ...config, permissionOverwrites: permissionOverwrites?.map(p => ({
                ...p,
                allow: BigInt(p.allow),
                deny: BigInt(p.deny)
            }))
        });
        return (channel as Eris.Channel).toJSON() as unknown as Entities.Channel;
    }

    public async setPermission(context: BBTagContext, channelId: string, overwrite: Entities.PermissionOverwrite, reason?: string): Promise<void> {
        if (overwrite.allow === '0' && overwrite.deny === '0')
            await this.#cluster.discord.deleteChannelPermission(channelId, overwrite.id, reason ?? context.auditReason());
        else
            await this.#cluster.discord.editChannelPermission(channelId, overwrite.id, BigInt(overwrite.allow), BigInt(overwrite.deny), overwrite.type, reason ?? context.auditReason());
    }
}

export class ErisUserProvider extends FuzzyQueryService<Eris.Member | Eris.User, Entities.User, 'user'> implements UserService {
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        super({
            cacheKey: 'user',
            find: (query, ctx) => cluster.util.findMembers(ctx.guild.id, query),
            getById: async (id, ctx) => await cluster.util.getMember(ctx.guild.id, id) ?? await cluster.util.getUser(id),
            getId: c => c.id,
            pickBest: (choices, query, ctx) => cluster.util.queryUser({ actors: ctx.user, context: ctx.channel, choices, filter: query }),
            alertCancelled: FuzzyQueryService.cancelled('user'),
            alertNotFound: FuzzyQueryService.notFound('user'),
            getResult: m => m.toJSON() as unknown as Entities.User
        });

        this.#cluster = cluster;
    }

    public async findBanned(context: BBTagContext): Promise<string[]> {
        const guild = await this.#cluster.util.getGuild(context.guild.id);
        if (guild === undefined)
            return [];

        await this.#cluster.util.ensureGuildBans(guild);
        return [...this.#cluster.util.getGuildBans(guild)];

    }

    public async edit(context: BBTagContext, userId: string, update: Partial<Entities.Member>, reason?: string): Promise<void> {
        await this.#cluster.discord.editGuildMember(context.guild.id, userId, update, reason ?? context.auditReason());
    }
}
export class ErisRoleProvider extends FuzzyQueryService<Eris.Role, Entities.Role, 'role'> implements RoleProvider {
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        super({
            cacheKey: 'role',
            find: (query, ctx) => cluster.util.findRoles(ctx.guild, query),
            getById: (id, ctx) => cluster.util.getRole(ctx.guild, id),
            getId: c => c.id,
            pickBest: (choices, query, ctx) => cluster.util.queryRole({ actors: ctx.user, context: ctx.channel, choices, filter: query }),
            alertCancelled: FuzzyQueryService.cancelled('role'),
            alertNotFound: FuzzyQueryService.notFound('role'),
            getResult: m => m.toJSON() as unknown as Entities.Role
        });

        this.#cluster = cluster;
    }

    public async edit(context: BBTagContext, roleId: string, update: Partial<Entities.Role>, reason?: string): Promise<void> {
        const { icon, ...rest } = update;
        await this.#cluster.discord.editRole(context.guild.id, roleId, {
            ...rest,
            icon: icon ?? undefined
        }, reason ?? context.auditReason());
    }

    public async delete(context: BBTagContext, roleId: string, reason?: string): Promise<void> {
        await this.#cluster.discord.deleteRole(context.guild.id, roleId, reason ?? context.auditReason());
    }
}
