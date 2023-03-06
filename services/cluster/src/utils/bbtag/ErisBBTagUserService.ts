import type { BBTagContext, Entities, EntityQueryService, FindEntityOptions, UserService } from '@bbtag/blargbot';
import { util } from '@blargbot/formatting';
import type * as Eris from 'eris';

import type { Cluster } from '../../Cluster.js';
import { createEntityQueryService } from './createEntityQueryService.js';
import { createCancelledAlerter, createNotFoundAlerter } from './defaultAlerts.js';

export class ErisBBTagUserService implements UserService {
    readonly #cluster: Cluster;
    readonly #querySingle: EntityQueryService<Entities.User>['querySingle'];

    public constructor(cluster: Cluster) {
        this.#cluster = cluster;
        this.#querySingle = createEntityQueryService({
            cacheKey: 'user',
            find: (query, ctx) => cluster.util.findMembers(ctx.guild.id, query),
            getById: async (id, ctx) => await cluster.util.getMember(ctx.guild.id, id) ?? await cluster.util.getUser(id),
            getId: c => c.id,
            // @ts-expect-error This is only a reference file for now
            pickBest: (choices, query, ctx) => cluster.util.queryUser({ actors: ctx.user.id, context: ctx.channel, choices, filter: query }),
            alertCancelled: createCancelledAlerter('user'),
            alertNotFound: createNotFoundAlerter('user'),
            getResult: this.#convertToUser.bind(this)
        });

    }

    #convertToUser(user: Eris.Member | Eris.User): Entities.User {
        throw user;
    }

    public async querySingle(context: BBTagContext, query: string, options?: FindEntityOptions | undefined): Promise<Entities.User | undefined> {
        return await this.#querySingle(context, query, options);
    }

    public async get(context: BBTagContext, id: string): Promise<Entities.User | undefined> {
        const entity = await this.#cluster.util.getMember(context.guild.id, id)
            ?? await this.#cluster.util.getUser(id);
        if (entity === undefined)
            return undefined;
        return this.#convertToUser(entity);
    }

    public async getAll(context: BBTagContext): Promise<Entities.User[]> {
        const guild = await this.#cluster.util.getGuild(context.guild.id);
        if (guild === undefined)
            return [];

        await this.#cluster.util.ensureMemberCache(guild);
        return guild.members.map(this.#convertToUser.bind(this));
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

    public mute(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, durationMs: number, reason?: string | undefined): Promise<'noPerms' | 'success' | 'alreadyTimedOut' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        // @ts-expect-error This is only a reference file for now
        return this.#cluster.moderation.timeouts.timeout(member, moderator, authorizer, durationMs, util.literal(reason));
    }

    public unmute(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string | undefined): Promise<'noPerms' | 'success' | 'moderatorNoPerms' | 'notTimedOut'> {
        // @ts-expect-error This is only a reference file for now
        return this.#cluster.moderation.timeouts.clearTimeout(member, moderator, authorizer, util.literal(reason));
    }

    public ban(guild: Entities.Guild, user: Entities.User, moderator: Entities.User, authorizer: Entities.User, deleteDays: number, reason: string, durationMs: number): Promise<'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        // @ts-expect-error This is only a reference file for now
        return this.#cluster.moderation.bans.ban(guild, user, moderator, authorizer, deleteDays, util.literal(reason), durationMs);
    }

    public unban(guild: Entities.Guild, user: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string): Promise<'success' | 'noPerms' | 'moderatorNoPerms' | 'notBanned'> {
        // @ts-expect-error This is only a reference file for now
        return this.#cluster.moderation.bans.unban(guild, user, moderator, authorizer, util.literal(reason));
    }

    public kick(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string): Promise<'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        // @ts-expect-error This is only a reference file for now
        return this.#cluster.moderation.bans.kick(member, moderator, authorizer, util.literal(reason));
    }
}
