import { EnsureMutedRoleResult, MuteResult, UnmuteResult } from '@blargbot/cluster/types';
import { discord, guard } from '@blargbot/cluster/utils';
import { UnmuteEventOptions } from '@blargbot/domain/models';
import { format, IFormattable } from '@blargbot/formatting';
import { mapping } from '@blargbot/mapping';
import { Constants, Guild, KnownGuildChannel, Member, Role, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import templates from '../../text';
import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

export class MuteManager extends ModerationManagerBase {
    public constructor(manager: ModerationManager) {
        super(manager);
    }

    public async mute(member: Member, moderator: User, reason?: IFormattable<string>, duration?: Duration): Promise<MuteResult> {
        const role = await this.#getMuteRole(member.guild);
        if (role === undefined)
            return 'roleMissing';

        if (member.roles.includes(role.id))
            return 'alreadyMuted';

        const self = member.guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('manageRoles') !== true)
            return 'noPerms';

        if (role.position >= discord.getMemberPosition(self))
            return 'roleTooHigh';

        const formatter = await this.manager.cluster.util.getFormatter(member.guild);
        await member.addRole(role.id, templates.moderation.auditLog({ moderator, reason })[format](formatter));
        if (duration !== undefined && duration.asMilliseconds() > 0) {
            await this.modLog.logTempMute(member.guild, member.user, duration, moderator, reason);
            await this.cluster.timeouts.insert('unmute', {
                source: member.guild.id,
                guild: member.guild.id,
                user: member.id,
                duration: JSON.stringify(duration),
                endtime: moment().add(duration).valueOf()
            });
        } else {
            await this.modLog.logMute(member.guild, member.user, moderator, reason);
        }
        return 'success';
    }

    public async unmute(member: Member, moderator: User, reason?: IFormattable<string>): Promise<UnmuteResult> {
        const role = await this.#getMuteRole(member.guild);
        if (role === undefined || !member.roles.includes(role.id))
            return 'notMuted';

        const self = member.guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('manageRoles') !== true)
            return 'noPerms';

        if (role.position >= discord.getMemberPosition(self))
            return 'roleTooHigh';

        const formatter = await this.manager.cluster.util.getFormatter(member.guild);
        await member.removeRole(role.id, templates.moderation.auditLog({ moderator, reason })[format](formatter));
        await this.modLog.logUnmute(member.guild, member.user, moderator, reason);

        return 'success';
    }

    public async ensureMutedRole(guild: Guild): Promise<EnsureMutedRoleResult> {
        const currentRole = await this.#getMuteRole(guild);
        if (currentRole !== undefined)
            return 'success';

        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('manageRoles') !== true)
            return 'noPerms';

        const newRole = await guild.createRole({
            color: 16711680,
            name: 'Muted',
            permissions: 0n
        });

        await this.cluster.database.guilds.setSetting(guild.id, 'mutedrole', newRole.id);

        if (!self.permissions.has('manageChannels'))
            return 'unconfigured';

        for (const channel of guild.channels.values()) {
            if (!guard.isThreadChannel(channel))
                await this.#configureChannel(channel, newRole);
        }
        return 'success';
    }

    async #configureChannel(channel: KnownGuildChannel, mutedRole: Role): Promise<void> {
        try {
            let deny = 0n;
            if (guard.isTextableChannel(channel))
                deny |= Constants.Permissions.sendMessages;
            else if (guard.isVoiceChannel(channel))
                deny |= Constants.Permissions.voiceSpeak;
            else if (guard.isCategoryChannel(channel))
                deny |= Constants.Permissions.sendMessages | Constants.Permissions.voiceSpeak;
            if (deny !== 0n) {
                const formatter = await this.manager.cluster.util.getFormatter(channel.guild);
                await channel.editPermission(mutedRole.id, 0n, deny, Constants.PermissionOverwriteTypes.ROLE, templates.mute.createReason[format](formatter));
            }
        } catch (err: unknown) {
            this.cluster.logger.error('Failed to set permissions for muted role', mutedRole.id, 'in channel', channel.id, err);
        }
    }

    async #getMuteRole(guild: Guild): Promise<Role | undefined> {
        // TODO mutedrole setting can be role id or tag
        const role = await this.cluster.database.guilds.getSetting(guild.id, 'mutedrole');
        if (role === undefined)
            return undefined;
        return guild.roles.get(role);
    }

    public async muteExpired(event: UnmuteEventOptions): Promise<void> {
        const guild = this.cluster.discord.guilds.get(event.guild);
        if (guild === undefined)
            return;

        const member = await this.cluster.util.getMember(guild, event.user);
        if (member === undefined)
            return;

        const mapResult = mapDuration(event.duration);
        const duration = mapResult.valid ? mapResult.value : undefined;

        await this.unmute(member, this.cluster.discord.user, templates.mute.autoUnmute({ duration }));
    }
}

const mapDuration = mapping.json(mapping.duration);
