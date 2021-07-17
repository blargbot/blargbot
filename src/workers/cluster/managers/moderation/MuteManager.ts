import { EnsureMutedRoleResult, MuteResult, UnmuteResult } from '@cluster/types';
import { guard, humanize, mapping } from '@cluster/utils';
import { UnmuteEventOptions } from '@core/types';
import { AnyGuildChannel, Constants, Guild, Member, Role, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

export class MuteManager extends ModerationManagerBase {
    public constructor(manager: ModerationManager) {
        super(manager);
    }

    public async mute(member: Member, moderator: User, reason?: string, duration?: Duration): Promise<MuteResult> {
        const role = await this.getMuteRole(member.guild);
        if (role === undefined)
            return 'roleMissing';

        if (member.roles.includes(role.id))
            return 'alreadyMuted';

        const self = member.guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('manageRoles') !== true)
            return 'noPerms';

        if (role.position >= this.cluster.util.getPosition(self))
            return 'roleTooHigh';

        await member.addRole(role.id, `[${humanize.fullName(moderator)}] ${reason ?? ''}`);
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

    public async unmute(member: Member, moderator: User, reason?: string): Promise<UnmuteResult> {
        const role = await this.getMuteRole(member.guild);
        if (role === undefined || !member.roles.includes(role.id))
            return 'notMuted';

        const self = member.guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('manageRoles') !== true)
            return 'noPerms';

        if (role.position >= this.cluster.util.getPosition(self))
            return 'roleTooHigh';

        await member.removeRole(role.id, `[${humanize.fullName(moderator)}] ${reason ?? ''}`);
        await this.modLog.logUnmute(member.guild, member.user, moderator, reason);

        return 'success';
    }

    public async ensureMutedRole(guild: Guild): Promise<EnsureMutedRoleResult> {
        const currentRole = await this.getMuteRole(guild);
        if (currentRole !== undefined)
            return 'success';

        const self = guild.members.get(this.cluster.discord.user.id);
        if (self === undefined)
            throw new Error('Cannot manage a server I am not a member of');

        if (!self.permissions.has('manageRoles'))
            return 'noPerms';

        const newRole = await guild.createRole({
            color: 16711680,
            name: 'Muted',
            permissions: 0
        });

        await this.cluster.database.guilds.setSetting(guild.id, 'mutedrole', newRole.id);

        if (!self.permissions.has('manageChannels'))
            return 'unconfigured';

        for (const channel of guild.channels.values()) {
            await this.configureChannel(channel, newRole);
        }
        return 'success';
    }

    private async configureChannel(channel: AnyGuildChannel, mutedRole: Role): Promise<void> {
        try {
            let deny = 0;

            if (guard.isTextableChannel(channel))
                deny = Constants.Permissions.sendMessages;
            else if (guard.isVoiceChannel(channel))
                deny = Constants.Permissions.voiceSpeak;
            else if (guard.isCategoryChannel(channel))
                deny = Constants.Permissions.sendMessages | Constants.Permissions.voiceSpeak;

            if (deny !== 0)
                await channel.editPermission(mutedRole.id, 0, deny, 'role', 'Automatic muted role configuration');

        } catch (err: unknown) {
            this.cluster.logger.error('Failed to set permissions for muted role', mutedRole.id, 'in channel', channel.id, err);
        }
    }

    private async getMuteRole(guild: Guild): Promise<Role | undefined> {
        const role = await this.cluster.database.guilds.getSetting(guild.id, 'mutedrole');
        if (role === undefined)
            return undefined;
        return guild.roles.get(role);
    }

    public async muteExpired(event: UnmuteEventOptions): Promise<void> {
        const guild = this.cluster.discord.guilds.get(event.guild);
        if (guild === undefined)
            return;

        const member = guild.members.get(event.user);
        if (member === undefined)
            return;

        const mapResult = mapDuration(event.duration);
        const duration = mapResult.valid ? humanize.duration(mapResult.value) : 'some time';

        await this.unmute(member, this.cluster.discord.user, `Automatically unmuted after ${duration}.`);
    }
}

const mapDuration = mapping.mapJson(mapping.mapDuration);
