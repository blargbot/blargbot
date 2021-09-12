import { Cluster } from '@cluster';
import { CommandGetCoreResult, CommandGetResult, ICommand, ICommandManager, PermissionCheckResult } from '@cluster/types';
import { defaultStaff, guard } from '@cluster/utils';
import { CommandPermissions } from '@core/types';
import { parse } from '@core/utils';
import { Guild, TextBasedChannels, User } from 'discord.js';

export abstract class BaseCommandManager<T> implements ICommandManager<T> {
    public abstract readonly size: number;

    protected constructor(
        protected readonly cluster: Cluster
    ) {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public load(_commands?: Iterable<string> | boolean): Promise<void> { return Promise.resolve(); }
    protected abstract getCore(name: string, location?: Guild | TextBasedChannels, user?: User): Promise<CommandGetCoreResult<T>>;
    protected abstract allCommandNames(location?: Guild | TextBasedChannels): AsyncIterable<string> | Iterable<string> | Promise<Iterable<string>>;
    public abstract configure(user: User, names: string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]>;

    public async get(name: string, location?: Guild | TextBasedChannels, user?: User): Promise<CommandGetResult<T>> {
        const result = await this.getCore(name.toLowerCase(), location, user);
        if (result.state !== 'FOUND')
            return result;

        if (user === undefined || location === undefined)
            return { state: 'ALLOWED', detail: result.detail };

        const permsResult = await this.checkPermissions(user, location, result.detail);
        if (permsResult.state !== 'ALLOWED')
            return permsResult;

        return { state: 'ALLOWED', detail: result.detail };
    }

    public async *list(location?: Guild | TextBasedChannels, user?: User): AsyncGenerator<ICommand<T>> {
        for await (const name of await this.allCommandNames(location)) {
            const result = await this.get(name, location, user);
            if (result.state === 'ALLOWED')
                yield result.detail;
        }
    }

    protected async checkPermissions(
        user: User,
        location: Guild | TextBasedChannels,
        permissions: CommandPermissions
    ): Promise<PermissionCheckResult> {
        if (this.cluster.util.isBotOwner(user.id))
            return { state: 'ALLOWED' };

        const blacklistReason = await this.cluster.database.users.getSetting(user.id, 'blacklisted');
        if (blacklistReason !== undefined)
            return { state: 'BLACKLISTED', detail: blacklistReason };

        if (permissions.disabled === true)
            // Command is disabled
            return { state: 'DISABLED' };

        const guild = location instanceof Guild ? location
            : guard.isGuildChannel(location) ? location.guild
                : undefined;

        if (guild === undefined)
            // Dms have no command restrictions
            return { state: 'ALLOWED' };

        const member = await this.cluster.util.getMember(guild, user.id);
        if (member === undefined)
            // User isnt in the guild and so cannot use commands
            return { state: 'NOT_IN_GUILD' };

        if (guild.ownerId === user.id || member.permissions.has('ADMINISTRATOR'))
            // Guild owners/admins can use all commands
            return { state: 'ALLOWED' };

        const staffPerms = parse.bigint(await this.cluster.util.database.guilds.getSetting(guild.id, 'staffperms') ?? defaultStaff);
        if (staffPerms !== undefined && this.cluster.util.hasPerms(member, staffPerms))
            // User has any of the permissions that identify them as a staff member
            return { state: 'ALLOWED' };

        let result: PermissionCheckResult = { state: 'ALLOWED' };
        if (permissions.permission !== undefined) {
            // User has any of the permissions for this command
            const perm = parse.bigint(permissions.permission);
            if (perm !== undefined) {
                if (this.cluster.util.hasPerms(member, perm))
                    return { state: 'ALLOWED' };
                result = { state: 'MISSING_PERMISSIONS', detail: perm };
            }
        }

        const adminrole = await this.cluster.util.database.guilds.getSetting(member.guild.id, 'adminrole');
        const roleIds = [adminrole, ...permissions.roles ?? []]
            .map(r => {
                if (r === undefined)
                    return undefined;

                const id = parse.entityId(r, '@&', true);
                if (id !== undefined)
                    return member.guild.roles.cache.get(id)?.id;

                const norm = r.toLowerCase();
                return member.guild.roles.cache.find(r => r.name.toLowerCase() === norm)?.id;
            }).filter(guard.hasValue);

        if (roleIds.length > 0) {
            // User has one of the roles this command is linked to or the admin role?
            if (member.roles.cache.hasAny(...roleIds))
                return { state: 'ALLOWED' };
            result = { state: 'MISSING_ROLE', detail: roleIds };
        }

        return result;
    }
}
