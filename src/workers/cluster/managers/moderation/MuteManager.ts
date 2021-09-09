import { EnsureMutedRoleResult, MuteResult, UnmuteResult } from '@cluster/types';
import { guard, humanize, mapping } from '@cluster/utils';
import { UnmuteEventOptions } from '@core/types';
import { Guild, GuildChannel, GuildMember, PermissionString, Role, User } from 'discord.js';
import moment, { Duration } from 'moment-timezone';

import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

export class MuteManager extends ModerationManagerBase {
    public constructor(manager: ModerationManager) {
        super(manager);
    }

    public async mute(member: GuildMember, moderator: User, reason?: string, duration?: Duration): Promise<MuteResult> {
        const role = await this.getMuteRole(member.guild);
        if (role === undefined)
            return 'roleMissing';

        if (member.roles.cache.has(role.id))
            return 'alreadyMuted';

        const self = member.guild.me;
        if (self?.permissions.has('MANAGE_ROLES') !== true)
            return 'noPerms';

        if (role.position >= self.roles.highest.position)
            return 'roleTooHigh';

        await member.roles.add(role.id, `[${humanize.fullName(moderator)}] ${reason ?? ''}`);
        await this.modLog.logMute(member.guild, member.user, moderator, reason);
        if (duration !== undefined && duration.asMilliseconds() > 0)
            await this.cluster.timeouts.insert('unmute', {
                source: member.guild.id,
                guild: member.guild.id,
                user: member.id,
                duration: JSON.stringify(duration),
                endtime: moment().add(duration).valueOf()
            });
        return 'success';
    }

    public async unmute(member: GuildMember, moderator: User, reason?: string): Promise<UnmuteResult> {
        const role = await this.getMuteRole(member.guild);
        if (role === undefined || !member.roles.cache.has(role.id))
            return 'notMuted';

        const self = member.guild.me;
        if (self?.permissions.has('MANAGE_ROLES') !== true)
            return 'noPerms';

        if (role.position >= self.roles.highest.position)
            return 'roleTooHigh';

        await member.roles.remove(role.id, `[${humanize.fullName(moderator)}] ${reason ?? ''}`);
        await this.modLog.logUnmute(member.guild, member.user, moderator, reason);

        return 'success';
    }

    public async ensureMutedRole(guild: Guild): Promise<EnsureMutedRoleResult> {
        const currentRole = await this.getMuteRole(guild);
        if (currentRole !== undefined)
            return 'success';

        const self = guild.me;
        if (self?.permissions.has('MANAGE_ROLES') !== true)
            return 'noPerms';

        const newRole = await guild.roles.create({
            color: 16711680,
            name: 'Muted',
            permissions: 0n
        });

        await this.cluster.database.guilds.setSetting(guild.id, 'mutedrole', newRole.id);

        if (!self.permissions.has('MANAGE_CHANNELS'))
            return 'unconfigured';

        for (const channel of guild.channels.cache.values()) {
            if (!guard.isThreadChannel(channel))
                await this.configureChannel(channel, newRole);
        }
        return 'success';
    }

    private async configureChannel(channel: GuildChannel, mutedRole: Role): Promise<void> {
        try {
            const deny: PermissionString[] = [];

            if (guard.isTextableChannel(channel))
                deny.push('SEND_MESSAGES');
            else if (guard.isVoiceChannel(channel))
                deny.push('SPEAK');
            else if (guard.isCategoryChannel(channel))
                deny.push('SEND_MESSAGES', 'SPEAK');

            if (deny.length > 0) {
                await channel.permissionOverwrites.create(
                    mutedRole,
                    Object.fromEntries(deny.map(s => [s, false] as const)),
                    {
                        reason: 'Automatic muted role configuration'
                    }
                );
            }

        } catch (err: unknown) {
            this.cluster.logger.error('Failed to set permissions for muted role', mutedRole.id, 'in channel', channel.id, err);
        }
    }

    private async getMuteRole(guild: Guild): Promise<Role | undefined> {
        // TODO mutedrole setting can be role id or tag
        const role = await this.cluster.database.guilds.getSetting(guild.id, 'mutedrole');
        if (role === undefined)
            return undefined;
        return guild.roles.cache.get(role);
    }

    public async muteExpired(event: UnmuteEventOptions): Promise<void> {
        const guild = this.cluster.discord.guilds.cache.get(event.guild);
        if (guild === undefined)
            return;

        const member = await this.cluster.util.getMember(guild, event.user);
        if (member === undefined)
            return;

        const mapResult = mapDuration(event.duration);
        const duration = mapResult.valid ? humanize.duration(mapResult.value) : 'some time';

        await this.unmute(member, this.cluster.discord.user, `Automatically unmuted after ${duration}.`);
    }
}

const mapDuration = mapping.mapJson(mapping.mapDuration);
