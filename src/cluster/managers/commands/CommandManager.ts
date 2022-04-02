import { Cluster } from '@blargbot/cluster';
import { CommandGetCoreResult, CommandGetResult, ICommand, ICommandManager, PermissionCheckResult } from '@blargbot/cluster/types';
import { defaultStaff, guard } from '@blargbot/cluster/utils';
import { parse } from '@blargbot/core/utils';
import { CommandPermissions } from '@blargbot/domain/models';
import { Guild, KnownGuildTextableChannel, User } from 'eris';

export abstract class CommandManager<T> implements ICommandManager<T> {
    public abstract readonly size: number;

    protected constructor(
        protected readonly cluster: Cluster
    ) {
    }

    public abstract load(commands?: Iterable<string> | boolean): Promise<void>;
    protected abstract getCore(name: string, location?: Guild | KnownGuildTextableChannel, user?: User): Promise<CommandGetCoreResult<T>>;
    protected abstract allCommandNames(location?: Guild | KnownGuildTextableChannel): AsyncIterable<string> | Iterable<string> | Promise<Iterable<string>>;
    public abstract configure(user: User, names: string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]>;

    public async get(name: string, location?: Guild | KnownGuildTextableChannel, user?: User): Promise<CommandGetResult<T>> {
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

    public async *list(location?: Guild | KnownGuildTextableChannel, user?: User): AsyncGenerator<ICommand<T>> {
        for await (const name of await this.allCommandNames(location)) {
            const result = await this.get(name, location, user);
            if (result.state === 'ALLOWED')
                yield result.detail;
        }
    }

    protected async checkPermissions(
        user: User,
        location: Guild | KnownGuildTextableChannel,
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

        if (guild.ownerID === user.id || member.permissions.has('administrator'))
            // Guild owners/admins can use all commands
            return { state: 'ALLOWED' };

        const staffPerms = parse.bigInt(await this.cluster.util.database.guilds.getSetting(guild.id, 'staffperms') ?? defaultStaff);
        if (staffPerms !== undefined && this.cluster.util.hasPerms(member, staffPerms))
            // User has any of the permissions that identify them as a staff member
            return { state: 'ALLOWED' };

        let result: PermissionCheckResult = { state: 'ALLOWED' };
        if (permissions.permission !== undefined) {
            // User has any of the permissions for this command
            const perm = parse.bigInt(permissions.permission);
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
                    return member.guild.roles.get(id)?.id;

                const norm = r.toLowerCase();
                return member.guild.roles.find(r => r.name.toLowerCase() === norm)?.id;
            }).filter(guard.hasValue);

        if (roleIds.length > 0) {
            // User has one of the roles this command is linked to or the admin role?
            if (member.roles.some(r => roleIds.includes(r)))
                return { state: 'ALLOWED' };
            result = { state: 'MISSING_ROLE', detail: roleIds };
        }

        return result;
    }
}
