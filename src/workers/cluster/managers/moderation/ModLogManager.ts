import { Cluster } from '@cluster';
import { guard, humanize, ModlogColour } from '@cluster/utils';
import { EmbedField, EmbedOptions, Guild, User } from 'eris';
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
        if (moderator === undefined && reason === undefined) {
            try {
                const banObject = await guild.getBan(user.id);
                reason = banObject.reason ?? undefined;
            } catch (e: unknown) {
                //NOOP
            }
        }
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

    public async logTempMute(guild: Guild, user: User, duration: Duration, moderator?: User, reason?: string): Promise<void> {
        await this.logAction({
            type: 'Temporary Mute',
            guildId: guild.id,
            user,
            moderator,
            reason,
            color: ModlogColour.MUTE,
            fields: [
                {
                    name: 'Duration',
                    value: humanize.duration(duration),
                    inline: true
                }
            ]
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

    public async logCustom(guild: Guild, action: string, user: User, moderator?: User, reason?: string, color?: number): Promise<void> {
        await this.logAction({
            type: action,
            guildId: guild.id,
            user: user,
            color: color,
            moderator: moderator,
            reason: reason
        });
    }

    public async updateReason(guild: Guild, caseId: number | undefined, moderator: User, reason: string): Promise<'SUCCESS' | 'MISSING_CASE' | 'SUCCESS_NO_MESSAGE'> {
        const modlog = await this.cluster.database.guilds.getModlogCase(guild.id, caseId);
        if (modlog === undefined)
            return 'MISSING_CASE';

        await this.cluster.database.guilds.updateModlogCase(guild.id, modlog.caseid, { reason, modid: moderator.id });

        if (modlog.msgid === undefined)
            return 'SUCCESS_NO_MESSAGE';

        const channelId = modlog.channelid ?? await this.cluster.database.guilds.getSetting(guild.id, 'modlog');
        if (channelId === undefined)
            return 'SUCCESS_NO_MESSAGE';

        const message = await this.cluster.util.getMessage(channelId, modlog.msgid);
        if (message === undefined || message.author.id !== this.cluster.discord.user.id)
            return 'SUCCESS_NO_MESSAGE';

        await message.edit({
            embeds: message.embeds.map(e => {
                const fields = [...e.fields ?? []];
                fields.splice(fields.findIndex(f => f.name === 'Reason'), 1, { name: 'Reason', value: reason, inline: true });
                return {
                    ...e,
                    fields,
                    footer: {
                        text: `${humanize.fullName(moderator)} (${moderator.id})`,
                        icon_url: moderator.avatarURL
                    }
                };
            })
        });
        return 'SUCCESS';
    }

    private async logAction({ guildId, user, reason, fields = [], color = 0x17c484, type = 'Generic', moderator }: ModerationLogOptions): Promise<void> {
        // TODO modlog setting can be channel id or tag
        const modlogChannelId = await this.cluster.database.guilds.getSetting(guildId, 'modlog');
        if (!guard.hasValue(modlogChannelId)) // TODO Should this still create the modlog entry in the db?
            return;

        const caseId = await this.cluster.database.guilds.getNewModlogCaseId(guildId);
        if (caseId === undefined)
            return;

        reason ??= `Responsible moderator, please do \`reason ${caseId}\` to set.`;

        const embed: EmbedOptions = {
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
                icon_url: moderator.avatarURL
            };
        }
        if (Array.isArray(user)) {
            embed.description = user.map(u => `${u.username}#${u.discriminator} (${u.id})`).join('\n');
        } else
            embed.author = this.cluster.util.embedifyAuthor(user);

        const modlogMessage = await this.cluster.util.send(modlogChannelId, { embeds: [embed] });
        await this.cluster.database.guilds.addModlogCase(guildId, {
            caseid: caseId,
            modid: moderator?.id,
            msgid: modlogMessage?.id,
            channelid: modlogMessage?.channel.id,
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
