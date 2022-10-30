import { Cluster } from '@blargbot/cluster';
import { guard, ModlogColour } from '@blargbot/cluster/utils';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent';
import { FormatEmbedField, FormatEmbedOptions } from '@blargbot/core/types';
import { format, IFormattable, util } from '@blargbot/formatting';
import { Guild, User } from 'eris';
import { Duration } from 'moment-timezone';

import templates from '../../text';

export class ModLogManager {
    public constructor(public readonly cluster: Cluster) {

    }

    public async logTimeout(guild: Guild, user: User, duration: Duration, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        await this.#logAction({
            type: templates.modlog.types.timeout,
            guildId: guild.id,
            user,
            color: ModlogColour.TIMEOUT,
            moderator,
            reason,
            fields: [
                {
                    name: templates.modlog.embed.field.user.name,
                    value: templates.modlog.embed.field.user.value({ user }),
                    inline: true
                },
                {
                    name: templates.modlog.embed.field.duration.name,
                    value: templates.modlog.embed.field.duration.value({ duration }),
                    inline: true
                }
            ]
        });
    }

    public async logTimeoutClear(guild: Guild, user: User, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        await this.#logAction({
            type: templates.modlog.types.timeoutClear,
            guildId: guild.id,
            user,
            color: ModlogColour.TIMEOUTCLEAR,
            moderator,
            reason,
            fields: [
                {
                    name: templates.modlog.embed.field.user.name,
                    value: templates.modlog.embed.field.user.value({ user }),
                    inline: true
                }
            ]
        });
    }

    public async logSoftban(guild: Guild, user: User, duration: Duration, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        await this.#logAction({
            type: templates.modlog.types.softBan,
            guildId: guild.id,
            user,
            color: ModlogColour.SOFTBAN,
            moderator,
            reason,
            fields: [
                {
                    name: templates.modlog.embed.field.user.name,
                    value: templates.modlog.embed.field.user.value({ user }),
                    inline: true
                },
                {
                    name: templates.modlog.embed.field.duration.name,
                    value: templates.modlog.embed.field.duration.value({ duration }),
                    inline: true
                }
            ]
        });
    }

    public async logBan(guild: Guild, user: User, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        if (moderator === undefined && reason === undefined) {
            try {
                const banObject = await guild.getBan(user.id);
                reason = util.literal(banObject.reason ?? undefined);
            } catch (e: unknown) {
                //NOOP
            }
        }

        await this.#logAction({
            type: templates.modlog.types.ban,
            guildId: guild.id,
            user,
            color: ModlogColour.BAN,
            moderator,
            reason,
            fields: [
                {
                    name: templates.modlog.embed.field.user.name,
                    value: templates.modlog.embed.field.user.value({ user }),
                    inline: true
                }
            ]
        });
    }

    public async logMassBan(guild: Guild, users: User[], moderator?: User, reason?: IFormattable<string>): Promise<void> {
        switch (users.length) {
            case 0: return;
            case 1: return await this.logBan(guild, users[0], moderator, reason);
            default: return await this.#logAction({
                type: templates.modlog.types.massBan,
                guildId: guild.id,
                user: users,
                color: ModlogColour.BAN,
                moderator,
                reason
            });
        }

    }

    public async logUnban(guild: Guild, user: User, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        await this.#logAction({
            type: templates.modlog.types.unban,
            guildId: guild.id,
            user,
            color: ModlogColour.BAN,
            moderator,
            reason
        });
    }

    public async logKick(guild: Guild, user: User, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        await this.#logAction({
            type: templates.modlog.types.kick,
            guildId: guild.id,
            user,
            color: ModlogColour.KICK,
            moderator,
            reason
        });
    }

    public async logUnmute(guild: Guild, user: User, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        await this.#logAction({
            type: templates.modlog.types.unmute,
            guildId: guild.id,
            user,
            moderator,
            reason,
            color: ModlogColour.UNMUTE
        });
    }

    public async logMute(guild: Guild, user: User, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        await this.#logAction({
            type: templates.modlog.types.mute,
            guildId: guild.id,
            user,
            moderator,
            reason,
            color: ModlogColour.MUTE
        });
    }

    public async logTempMute(guild: Guild, user: User, duration: Duration, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        await this.#logAction({
            type: templates.modlog.types.temporaryMute,
            guildId: guild.id,
            user,
            moderator,
            reason,
            color: ModlogColour.MUTE,
            fields: [
                {
                    name: templates.modlog.embed.field.duration.name,
                    value: templates.modlog.embed.field.duration.value({ duration }),
                    inline: true
                }
            ]
        });
    }

    public async logWarn(guild: Guild, user: User, count: number, newTotal: number, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        await this.#logAction({
            type: templates.modlog.types.warning,
            guildId: guild.id,
            user,
            moderator,
            color: ModlogColour.WARN,
            reason,
            fields: [
                {
                    name: templates.modlog.embed.field.warnings.name,
                    value: templates.modlog.embed.field.warnings.value({ count, warnings: newTotal }),
                    inline: true
                }
            ]
        });
    }

    public async logPardon(guild: Guild, user: User, count: number, newTotal: number, moderator?: User, reason?: IFormattable<string>): Promise<void> {
        await this.#logAction({
            type: templates.modlog.types.pardon,
            guildId: guild.id,
            user,
            color: ModlogColour.PARDON,
            moderator,
            reason,
            fields: [
                {
                    name: templates.modlog.embed.field.pardons.name,
                    value: templates.modlog.embed.field.pardons.value({ count, warnings: newTotal }),
                    inline: true
                }
            ]
        });
    }

    public async logCustom(guild: Guild, action: IFormattable<string>, user: User, moderator?: User, reason?: IFormattable<string>, color?: number): Promise<void> {
        await this.#logAction({
            type: action,
            guildId: guild.id,
            user,
            color,
            moderator,
            reason
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
                        text: `${moderator.username}#${moderator.discriminator} (${moderator.id})`,
                        icon_url: moderator.avatarURL
                    }
                };
            })
        });
        return 'SUCCESS';
    }

    async #logAction({ guildId, user, reason, fields = [], color = 0x17c484, type, moderator }: ModerationLogOptions): Promise<void> {
        // TODO modlog setting can be channel id or tag
        type ??= templates.modlog.types.generic;
        const modlogChannelId = await this.cluster.database.guilds.getSetting(guildId, 'modlog');
        if (!guard.hasValue(modlogChannelId)) // TODO Should this still create the modlog entry in the db?
            return;

        const caseId = await this.cluster.database.guilds.getNewModlogCaseId(guildId);
        if (caseId === undefined)
            return;

        const embed: FormatEmbedOptions<IFormattable<string>> = {
            title: templates.modlog.embed.title({ caseId }),
            color: color,
            timestamp: new Date(),
            fields: [
                {
                    name: templates.modlog.embed.field.type.name,
                    value: type,
                    inline: true
                },
                {
                    name: templates.modlog.embed.field.reason.name,
                    value: templates.modlog.embed.field.reason.value({
                        reason: reason ??= templates.modlog.defaultReason({
                            caseId,
                            prefix: this.cluster.config.discord.defaultPrefix
                        })
                    }),
                    inline: true
                },
                ...fields
            ]
        };
        if (Array.isArray(user)) {
            if (moderator !== undefined && user.includes(moderator))
                moderator = this.cluster.discord.user;
            embed.description = templates.modlog.embed.description({ users: user });
        } else {
            if (moderator === user)
                moderator = this.cluster.discord.user;
            embed.author = this.cluster.util.embedifyAuthor(user, true);
        }

        if (moderator !== undefined) {
            embed.footer = {
                text: templates.modlog.embed.footer.text({ user: moderator }),
                icon_url: moderator.avatarURL
            };
        }

        let modlogMessage;
        try {
            modlogMessage = await this.cluster.util.send(modlogChannelId, new FormattableMessageContent({ embeds: [embed] }));
        } catch (err: unknown) {
            if (err instanceof Error && err.message === 'Channel not found')
                await this.cluster.database.guilds.setSetting(guildId, 'modlog', undefined);
            else
                throw err;
        }

        const formatter = await this.cluster.util.getFormatter(guildId);
        await this.cluster.database.guilds.addModlogCase(guildId, {
            caseid: caseId,
            modid: moderator?.id,
            msgid: modlogMessage?.id,
            channelid: modlogMessage?.channel.id,
            reason: reason[format](formatter),
            type: type[format](formatter),
            userid: Array.isArray(user) ? user.map(u => u.id).join(',') : user.id
        });
    }
}

interface ModerationLogOptions {
    readonly guildId: string;
    readonly user: User | readonly User[];
    readonly moderator?: User;
    readonly type?: IFormattable<string>;
    readonly reason?: IFormattable<string>;
    readonly color?: number;
    readonly fields?: ReadonlyArray<FormatEmbedField<IFormattable<string>>>;
}
