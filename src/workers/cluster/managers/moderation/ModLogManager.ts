import { Cluster } from '@cluster';
import { guard, humanize, ModlogColour } from '@cluster/utils';
import { EmbedField, Guild, MessageEmbedOptions, User } from 'discord.js';
import { Duration } from 'moment-timezone';

export class ModLogManager {
    public constructor(public readonly cluster: Cluster) {

    }

    public async logSoftban(guild: Guild, user: User, duration: Duration, moderator?: User, reason?: string): Promise<void> {
        await this.logAction({
            type: 'Soft Ban',
            guildId: guild.id,
            user: user,
            color: ModlogColour.SOFTBAN,
            moderator: moderator,
            reason: reason,
            fields: [{
                name: 'User',
                value: `${humanize.fullName(user)} (${user.id})`,
                inline: true
            }, {
                name: 'Duration',
                value: humanize.duration(duration),
                inline: true
            }]
        });
    }

    public async logBan(guild: Guild, user: User, moderator?: User, reason?: string): Promise<void> {
        await this.logAction({
            type: 'Ban',
            guildId: guild.id,
            user: user,
            color: ModlogColour.BAN,
            moderator: moderator,
            reason: reason,
            fields: [{
                name: 'User',
                value: `${humanize.fullName(user)} (${user.id})`,
                inline: true
            }]
        });
    }

    public async logMassBan(guild: Guild, users: User[], moderator?: User, reason?: string): Promise<void> {
        switch (users.length) {
            case 0: return;
            case 1: return await this.logBan(guild, users[0], moderator, reason);
            default: return await this.logAction({
                type: 'Mass Ban',
                guildId: guild.id,
                user: users,
                color: ModlogColour.BAN,
                moderator: moderator,
                reason: reason
            });
        }

    }

    public async logUnban(guild: Guild, user: User, moderator?: User, reason?: string): Promise<void> {
        await this.logAction({
            type: 'Unban',
            guildId: guild.id,
            user: user,
            color: ModlogColour.BAN,
            moderator: moderator,
            reason: reason
        });
    }

    public async logKick(guild: Guild, user: User, moderator?: User, reason?: string): Promise<void> {
        await this.logAction({
            type: 'Kick',
            guildId: guild.id,
            user: user,
            color: ModlogColour.KICK,
            moderator: moderator,
            reason: reason
        });
    }

    public async logUnmute(guild: Guild, user: User, moderator?: User, reason?: string): Promise<void> {
        await this.logAction({
            type: 'Unmute',
            guildId: guild.id,
            user: user,
            moderator: moderator,
            reason: reason,
            color: ModlogColour.UNMUTE
        });
    }

    public async logMute(guild: Guild, user: User, moderator?: User, reason?: string): Promise<void> {
        await this.logAction({
            type: 'Mute',
            guildId: guild.id,
            user: user,
            moderator: moderator,
            reason: reason,
            color: ModlogColour.MUTE
        });
    }

    public async logWarn(guild: Guild, user: User, count: number, newTotal: number, moderator?: User, reason?: string): Promise<void> {
        await this.logAction({
            type: 'Warning',
            guildId: guild.id,
            user: user,
            moderator: moderator,
            color: ModlogColour.WARN,
            reason: reason,
            fields: [{
                name: 'Warnings',
                value: `Assigned: ${count}\nNew Total: ${newTotal}`,
                inline: true
            }]
        });
    }

    public async logPardon(guild: Guild, user: User, count: number, newTotal: number, moderator?: User, reason?: string): Promise<void> {
        await this.logAction({
            type: 'Pardon',
            guildId: guild.id,
            user: user,
            color: ModlogColour.PARDON,
            moderator: moderator,
            reason: reason,
            fields: [{
                name: 'Pardons',
                value: `Assigned: ${count}\nNew Total: ${newTotal}`,
                inline: true
            }]
        });
    }

    private async logAction({ guildId, user, reason, fields = [], color = 0x17c484, type = 'Generic', moderator }: ModerationLogOptions): Promise<void> {
        const modlogChannelId = await this.cluster.database.guilds.getSetting(guildId, 'modlog');
        if (!guard.hasValue(modlogChannelId))
            return;

        const caseId = await this.cluster.database.guilds.getNewModlogCaseId(guildId);
        if (caseId === undefined)
            return;

        reason ??= `Responsible moderator, please do \`reason ${caseId}\` to set.`;

        const embed: MessageEmbedOptions = {
            title: `Case ${caseId}`,
            color: color,
            timestamp: new Date(),
            fields: [
                { name: 'Type', value: type, inline: true },
                { name: 'Reason', value: reason, inline: true },
                ...fields
            ]
        };
        if (moderator !== undefined) {
            embed.footer = {
                text: `${humanize.fullName(moderator)} (${moderator.id})`,
                iconURL: moderator.avatarURL({ dynamic: true }) ?? moderator.defaultAvatarURL
            };
        }
        if (Array.isArray(user)) {
            embed.description = user.map(u => `${u.username}#${u.discriminator} (${u.id})`).join('\n');
        } else {
            embed.author = {
                name: `${humanize.fullName(user)} (${user.id})`,
                iconURL: user.avatarURL({ dynamic: true }) ?? user.defaultAvatarURL
            };
        }

        const modlogMessage = await this.cluster.util.send(modlogChannelId, { embeds: [embed] });
        await this.cluster.database.guilds.addModlog(guildId, {
            caseid: caseId,
            modid: moderator?.id,
            msgid: modlogMessage?.id,
            reason: reason,
            type: type,
            userid: Array.isArray(user) ? user.map(u => u.id).join(',') : user.id
        });
    }
}

interface ModerationLogOptions {
    readonly guildId: string;
    readonly user: User | readonly User[];
    readonly moderator?: User;
    readonly type?: string;
    readonly reason?: string;
    readonly color?: number;
    readonly fields?: readonly EmbedField[];
}
