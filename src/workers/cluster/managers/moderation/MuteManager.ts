import { AnyGuildChannel, Constants, Guild, Member, Role, User } from 'eris';
import moment, { Duration } from 'moment-timezone';
import { Cluster } from '../../Cluster';
import { EnsureMutedRoleResult, guard, humanize, mapping, Modlog, MuteResult, UnmuteEventOptions, UnmuteResult } from '../../core';
import { ModerationManager } from '../ModerationManager';

export class MuteManager {
    private get cluster(): Cluster { return this.manager.cluster; }
    private get modlog(): Modlog { return this.manager.modlog; }

    public constructor(public readonly manager: ModerationManager) {
    }

    public init(): void {
        this.cluster.timeouts.on('unmute', event => void this.handleUnmuteTimeout(event));
        // TODO listen to guild join/leave to make bypassing mutes harder
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
        await this.modlog.logMute(member.guild, member.user, moderator, reason);
        if (duration !== undefined && duration.asMilliseconds() > 0)
            await this.cluster.timeouts.insert('unmute', {
                source: member.guild.id,
                guild: member.guild.id,
                user: member.id,
                duration: JSON.stringify(duration),
                endtime: moment().add(duration).toDate()
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
        await this.modlog.logUnmute(member.guild, member.user, moderator, reason);

        return 'success';
    }

    public async ensureMutedRole(guild: Guild): Promise<EnsureMutedRoleResult> {
        const currentRole = await this.getMuteRole(guild);
        if (currentRole !== undefined)
            return { state: 'success', role: currentRole };

        const self = guild.members.get(this.cluster.discord.user.id);
        if (self === undefined)
            throw new Error('Cannot manage a server I am not a member of');

        if (!self.permissions.has('manageRoles'))
            return { state: 'noPerms', role: undefined };

        const newRole = await guild.createRole({
            color: 16711680,
            name: 'Muted',
            permissions: 0
        });

        await this.cluster.database.guilds.setSetting(guild.id, 'mutedrole', newRole.id);

        if (!self.permissions.has('manageChannels'))
            return { state: 'unconfigured', role: newRole };

        for (const channel of guild.channels.values()) {
            await this.configureChannel(channel, newRole);
        }
        return { state: 'success', role: newRole };
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

    private async handleUnmuteTimeout(event: UnmuteEventOptions): Promise<void> {
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

const mapDuration = mapping.json(mapping.duration);
