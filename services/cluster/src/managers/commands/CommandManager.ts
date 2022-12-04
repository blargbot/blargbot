import { Cluster } from '@blargbot/cluster';
import { CommandGetCoreResult, CommandGetResult, ICommandManager, PermissionCheckResult } from '@blargbot/cluster/types.js';
import { defaultStaff, guard } from '@blargbot/cluster/utils/index.js';
import { parse } from '@blargbot/core/utils/index.js';
import { CommandPermissions } from '@blargbot/domain/models/index.js';
import * as Eris from 'eris';

export abstract class CommandManager<T> implements ICommandManager<T> {
    public abstract readonly size: number;

    protected constructor(
        protected readonly cluster: Cluster
    ) {
    }

    public abstract load(rediscover?: boolean): Promise<void>;
    protected abstract getCore(name: string, location?: Eris.Guild | Eris.KnownGuildTextableChannel, user?: Eris.User): Promise<CommandGetCoreResult<T>>;
    protected abstract allCommandNames(location?: Eris.Guild | Eris.KnownGuildTextableChannel): AsyncIterable<string> | Iterable<string> | Promise<Iterable<string>>;
    public abstract configure(user: Eris.User, names: string[], guild: Eris.Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]>;

    public async get(name: string, location?: Eris.Guild | Eris.KnownGuildTextableChannel, user?: Eris.User): Promise<CommandGetResult<T>> {
        const findResult = await this.getCore(name.toLowerCase(), location, user);
        if (findResult.state !== 'FOUND')
            return findResult;

        const command = findResult.detail;
        if (user === undefined || location === undefined)
            return { state: 'ALLOWED', detail: { command, reason: undefined } };

        const { state, detail: reason } = await this.checkPermissions(user, location, command);
        switch (state) {
            case 'ALLOWED': return { state, detail: { command, reason } };
            case 'BLACKLISTED': return { state, detail: { command, reason } };
            case 'DISABLED': return { state, detail: { command, reason } };
            case 'MISSING_PERMISSIONS': return { state, detail: { command, reason } };
            case 'MISSING_ROLE': return { state, detail: { command, reason } };
            case 'NOT_IN_GUILD': return { state, detail: { command, reason } };
        }
    }

    public async *list(location?: Eris.Guild | Eris.KnownGuildTextableChannel, user?: Eris.User): AsyncGenerator<CommandGetResult<T>> {
        for await (const name of await this.allCommandNames(location)) {
            yield await this.get(name, location, user);
        }
    }

    protected async checkPermissions(
        user: Eris.User,
        location: Eris.Guild | Eris.KnownGuildTextableChannel,
        permissions: Required<CommandPermissions>
    ): Promise<PermissionCheckResult> {
        if (this.cluster.util.isBotOwner(user.id))
            return { state: 'ALLOWED' };

        const blacklistReason = await this.cluster.database.users.getProp(user.id, 'blacklisted');
        if (blacklistReason !== undefined)
            return { state: 'BLACKLISTED', detail: blacklistReason };

        if (permissions.disabled || permissions.hidden)
            // Command is disabled
            return { state: 'DISABLED' };

        const guild = location instanceof Eris.Guild ? location
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

        const adminrole = await this.cluster.util.database.guilds.getSetting(member.guild.id, 'adminrole');
        const adminroleId = findRoleId(member.guild.roles, adminrole);
        if (adminroleId !== undefined && member.roles.includes(adminroleId)) {
            // Guild admins can use all commands
            return { state: 'ALLOWED' };
        }

        const staffPerms = parse.bigInt(await this.cluster.util.database.guilds.getSetting(guild.id, 'staffperms') ?? defaultStaff);
        if (staffPerms !== undefined && this.cluster.util.hasPerms(member, staffPerms))
            // User has any of the permissions that identify them as a staff member
            return { state: 'ALLOWED' };

        let result: PermissionCheckResult = { state: 'ALLOWED' };
        if (permissions.permission !== '0') {
            // User has any of the permissions for this command
            const perm = parse.bigInt(permissions.permission);
            if (perm !== undefined && perm !== 0n) {
                if (this.cluster.util.hasPerms(member, perm))
                    return { state: 'ALLOWED' };
                result = { state: 'MISSING_PERMISSIONS', detail: perm };
            }
        }

        const roleIds = [...permissions.roles]
            .map(findRoleId.bind(undefined, member.guild.roles))
            .filter(guard.hasValue);

        if (roleIds.length > 0) {
            // User has one of the roles this command is linked to or the admin role?
            if (member.roles.some(r => roleIds.includes(r)))
                return { state: 'ALLOWED' };
            result = { state: 'MISSING_ROLE', detail: roleIds };
        }

        return result;
    }
}

function findRoleId(roles: Eris.Collection<Eris.Role>, roleSetting: string | undefined): string | undefined {
    if (roleSetting === undefined)
        return undefined;

    const id = parse.entityId(roleSetting, '@&', true);
    if (id !== undefined)
        return roles.get(id)?.id;

    const norm = roleSetting.toLowerCase();
    return roles.find(r => r.name.toLowerCase() === norm)?.id;
}
