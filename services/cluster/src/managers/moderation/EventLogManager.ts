import type { ChatLog } from '@blargbot/chat-log-client';
import type { Cluster } from '@blargbot/cluster';
import { ModlogColour } from '@blargbot/cluster/utils/index.js';
import type { BaseUtilities } from '@blargbot/core/BaseUtilities.js';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import type { FormatEmbedAuthor, FormatEmbedField, FormatEmbedOptions } from '@blargbot/core/types.js';
import { isGuildMessage } from '@blargbot/core/utils/guard/isGuildMessage.js';
import { isGuildChannel, isTextableChannel } from '@blargbot/discord-util';
import type { StoredGuildEventLogType } from '@blargbot/domain/models/index.js';
import type { IFormattable } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';
import * as Eris from 'eris';
import moment from 'moment-timezone';

import templates from '../../text.js';

export class EventLogManager {
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        this.#cluster = cluster;
    }

    public async userTimedOut(member: Eris.Member): Promise<void> {
        const channel = await this.#getLogChannel('membertimeout', member.guild.id);
        if (channel !== undefined && !await this.#isExempt(member.guild.id, member.user.id) && member.communicationDisabledUntil !== null) {
            await this.#logEvent('membertimeout', channel, this.#eventLogEmbed(templates.eventLog.events.timeoutAdded, member.user, ModlogColour.TIMEOUT, {
                fields: [
                    {
                        name: templates.eventLog.embed.field.until.name,
                        value: templates.eventLog.embed.field.until.value({ time: moment(member.communicationDisabledUntil) }),
                        inline: true
                    }
                ]
            }));
        }
    }

    public async userTimeoutCleared(member: Eris.Member): Promise<void> {
        const channel = await this.#getLogChannel('membertimeoutclear', member.guild.id);
        if (channel === undefined || await this.#isExempt(member.guild.id, member.id))
            return;

        const now = moment();
        const auditEvents = await tryGetAuditLogs(member.guild, 50, undefined, Eris.AuditLogActionType.MEMBER_UPDATE);
        const audit = auditEvents?.entries.find(e => e.targetID === member.id
            && moment(e.createdAt).isAfter(now.add(-1, 'second'))
            && (e.after?.communicationDisabledUntil === null || (e.after?.communicationDisabledUntil as number) < (e.before?.communicationDisabledUntil as number)));
        const reason = audit?.reason ?? undefined;
        const moderator = audit?.user ?? undefined;

        await this.#logEvent('membertimeoutclear', channel, this.#eventLogEmbed(templates.eventLog.events.timeoutRemoved, member.user, ModlogColour.TIMEOUTCLEAR, {
            fields: [
                ...moderator !== undefined ? [{
                    name: templates.eventLog.embed.field.updatedBy.name,
                    value: templates.eventLog.embed.field.updatedBy.value({ userId: member.id })
                }] : [],
                ...reason !== undefined ? [{
                    name: templates.eventLog.embed.field.reason.name,
                    value: templates.eventLog.embed.field.reason.value({ reason })
                }] : []
            ]
        }));
    }

    public async userBanned(guild: Eris.Guild, user: Eris.User): Promise<void> {
        const channel = await this.#getLogChannel('memberban', guild.id);
        if (channel !== undefined && !await this.#isExempt(guild.id, user.id))
            await this.#logEvent('memberban', channel, this.#eventLogEmbed(templates.eventLog.events.banned, user, ModlogColour.BAN));
    }

    public async userUnbanned(guild: Eris.Guild, user: Eris.User): Promise<void> {
        const channel = await this.#getLogChannel('memberunban', guild.id);
        if (channel !== undefined && !await this.#isExempt(guild.id, user.id))
            await this.#logEvent('memberunban', channel, this.#eventLogEmbed(templates.eventLog.events.unbanned, user, ModlogColour.UNBAN));
    }

    public async userJoined(member: Eris.Member): Promise<void> {
        const channel = await this.#getLogChannel('memberjoin', member.guild.id);
        if (channel !== undefined && !await this.#isExempt(member.guild.id, member.user.id)) {
            await this.#logEvent('memberjoin', channel, this.#eventLogEmbed(templates.eventLog.events.joined, member.user, 0x1ad8bc, {
                fields: [
                    {
                        name: templates.eventLog.embed.field.created.name,
                        value: templates.eventLog.embed.field.created.value({ time: moment(member.user.createdAt) }),
                        inline: true
                    }
                ]
            }));
        }
    }

    public async userLeft(member: Eris.Member): Promise<void> {
        const channel = await this.#getLogChannel('memberleave', member.guild.id);
        if (channel !== undefined && !await this.#isExempt(member.guild.id, member.user.id))
            await this.#logEvent('memberleave', channel, this.#eventLogEmbed(templates.eventLog.events.left, member.user, 0xd8761a));
    }

    public async messagesDeleted(messages: readonly Eris.PossiblyUncachedMessage[]): Promise<void> {
        if (messages.length === 0)
            return;

        const guildId = 'guild' in messages[0].channel ? messages[0].channel.guild?.id : undefined;
        if (guildId === undefined)
            return;

        const logChannel = await this.#getLogChannel('messagedelete', guildId);
        if (logChannel === undefined)
            return;

        const details = await Promise.all(messages.map(m => this.#getMessageDetails(m)));
        const authorIds = details.map(d => d.authorId).filter(hasValue);
        if (authorIds.length > 0 && await this.#isExempt(guildId, ...authorIds))
            return;

        await Promise.all(details.map(d => this.#logMessageDeleted(guildId, d, logChannel)));
        await this.#logEvent('messagedelete', logChannel, this.#eventLogEmbed(templates.eventLog.events.messageDeleted, undefined, 0xaf1d1d, {
            description: templates.eventLog.embed.description.bulkDelete,
            fields: [
                {
                    name: templates.eventLog.embed.field.count.name,
                    value: templates.eventLog.embed.field.count.value({ count: messages.length }),
                    inline: true
                },
                {
                    name: templates.eventLog.embed.field.channel.name,
                    value: templates.eventLog.embed.field.channel.value({ channelIds: new Set(messages.map(m => m.channel.id)) }),
                    inline: true
                }
            ]
        }));
    }

    public async messageDeleted(message: Eris.PossiblyUncachedMessage): Promise<void> {
        const guildId = 'guild' in message.channel ? message.channel.guild?.id : undefined;
        if (guildId === undefined)
            return;

        const logChannel = await this.#getLogChannel('messagedelete', guildId);
        if (logChannel === undefined)
            return;

        const details = await this.#getMessageDetails(message);
        if (details.authorId !== undefined && await this.#isExempt(guildId, details.authorId))
            return;

        await this.#logMessageDeleted(guildId, details, logChannel);
    }

    public async messageUpdated(message: Eris.Message<Eris.PossiblyUncachedTextableChannel>, oldMessage: Eris.OldMessage | null): Promise<void> {
        const guildId = isGuildMessage(message) ? message.channel.guild.id : undefined;
        if (guildId === undefined)
            return;

        const logChannel = await this.#getLogChannel('messageupdate', guildId);
        if (logChannel === undefined || await this.#isExempt(guildId, message.author.id))
            return;

        const oldContent = oldMessage?.content; //?? (await this.#cluster.database.chatlogs.getByMessageId(message.id))?.content;
        if (oldContent === undefined || message.content === oldContent)
            return;

        const lastUpdate = moment(message.editedTimestamp ?? message.createdAt);

        const embed = this.#eventLogEmbed(templates.eventLog.events.messageUpdated, message.author, 0x771daf, {
            fields: [
                {
                    name: templates.eventLog.embed.field.message.name,
                    value: templates.eventLog.embed.field.message.value({ messageId: message.id }),
                    inline: true
                },
                {
                    name: templates.eventLog.embed.field.channel.name,
                    value: templates.eventLog.embed.field.channel.value({ channelIds: [message.channel.id] }),
                    inline: true
                },
                await this.#getContentEmbedField(guildId, 'old', oldContent, lastUpdate),
                await this.#getContentEmbedField(guildId, 'new', message.content, lastUpdate)
            ]
        });
        await this.#logEvent('messageupdate', logChannel, embed);
    }

    public async roleRemoved(member: Eris.Member, roleId: string): Promise<void> {
        const channel = await this.#getLogChannel(`role:${roleId}`, member.guild.id);
        if (channel === undefined || await this.#isExempt(member.guild.id, member.user.id))
            return;

        const now = moment();
        const auditEvents = await tryGetAuditLogs(member.guild, 50, undefined, Eris.AuditLogActionType.MEMBER_ROLE_UPDATE);
        const audit = auditEvents?.entries.find(e => e.targetID === member.id && moment(e.createdAt).isAfter(now.add(-1, 'second')));
        const reason = audit?.reason ?? undefined;
        const moderator = audit?.user ?? undefined;
        await this.#logEvent(`role:${roleId}`, channel, this.#eventLogEmbed(templates.eventLog.events.roleRemoved, member.user, 0, {
            fields: [
                {
                    name: templates.eventLog.embed.field.role.name,
                    value: templates.eventLog.embed.field.role.value({ roleId })
                },
                ...moderator !== undefined ? [{
                    name: templates.eventLog.embed.field.updatedBy.name,
                    value: templates.eventLog.embed.field.updatedBy.value({ userId: member.id })
                }] : [],
                ...reason !== undefined ? [{
                    name: templates.eventLog.embed.field.reason.name,
                    value: templates.eventLog.embed.field.reason.value({ reason })
                }] : []
            ]
        }));
    }

    public async roleAdded(member: Eris.Member, roleId: string): Promise<void> {
        const channel = await this.#getLogChannel(`role:${roleId}`, member.guild.id);
        if (channel === undefined || await this.#isExempt(member.guild.id, member.user.id))
            return;

        const now = moment();
        const auditEvents = await tryGetAuditLogs(member.guild, 50, undefined, Eris.AuditLogActionType.MEMBER_ROLE_UPDATE);
        const audit = auditEvents?.entries.find(e => e.targetID === member.id && moment(e.createdAt).isAfter(now.add(-1, 'second')));
        const reason = audit?.reason ?? undefined;
        const moderator = audit?.user ?? undefined;
        await this.#logEvent(`role:${roleId}`, channel, this.#eventLogEmbed(templates.eventLog.events.roleAdded, member.user, 0, {
            fields: [
                {
                    name: templates.eventLog.embed.field.role.name,
                    value: templates.eventLog.embed.field.role.value({ roleId })
                },
                ...moderator !== undefined ? [{
                    name: templates.eventLog.embed.field.updatedBy.name,
                    value: templates.eventLog.embed.field.updatedBy.value({ userId: member.id })
                }] : [],
                ...reason !== undefined ? [{
                    name: templates.eventLog.embed.field.reason.name,
                    value: templates.eventLog.embed.field.reason.value({ reason })
                }] : []
            ]
        }));
    }

    public async nicknameUpdated(member: Eris.Member, oldNickname: string | undefined): Promise<void> {
        const channel = await this.#getLogChannel('nickupdate', member.guild.id);
        if (channel !== undefined && !await this.#isExempt(member.guild.id, member.user.id)) {
            await this.#logEvent('nickupdate', channel, this.#eventLogEmbed(templates.eventLog.events.nicknameUpdated, member.user, 0xd8af1a, {
                fields: [
                    {
                        name: templates.eventLog.embed.field.oldNickname.name,
                        value: templates.eventLog.embed.field.oldNickname.value({ nickname: oldNickname ?? member.username }),
                        inline: true
                    },
                    {
                        name: templates.eventLog.embed.field.newNickname.name,
                        value: templates.eventLog.embed.field.newNickname.value({ nickname: member.nick ?? member.username }),
                        inline: true
                    }
                ]
            }));
        }
    }

    public async userTagUpdated(user: Eris.User, oldUser: Eris.User): Promise<void> {
        const embed = this.#eventLogEmbed(templates.eventLog.events.usernameUpdated, user, 0xd8af1a, {
            description: oldUser.username !== user.username
                ? oldUser.discriminator !== user.discriminator
                    ? templates.eventLog.embed.description.userUpdated.both
                    : templates.eventLog.embed.description.userUpdated.username
                : oldUser.discriminator !== user.discriminator
                    ? templates.eventLog.embed.description.userUpdated.discriminator
                    : undefined,
            fields: [
                {
                    name: templates.eventLog.embed.field.oldUsername.name,
                    value: templates.eventLog.embed.field.oldUsername.value({ user: oldUser }),
                    inline: true
                },
                {
                    name: templates.eventLog.embed.field.newUsername.name,
                    value: templates.eventLog.embed.field.newUsername.value({ user }),
                    inline: true
                }
            ]
        });

        await Promise.all(
            this.#cluster.discord.guilds
                .filter(g => g.members.get(user.id) !== undefined)
                .map(async guild => {
                    const channel = await this.#getLogChannel('nameupdate', guild.id);
                    if (channel !== undefined && !await this.#isExempt(guild.id, user.id))
                        await this.#logEvent('nameupdate', channel, embed);
                })
        );
    }

    public async userAvatarUpdated(user: Eris.User, oldUser: Eris.User): Promise<void> {
        const embed = this.#eventLogEmbed(templates.eventLog.events.avatarUpdated, user, 0xd8af1a, {
            image: { url: user.avatarURL },
            thumbnail: { url: oldUser.avatarURL },
            description: templates.eventLog.embed.description.avatarUpdated
        });

        await Promise.all(
            this.#cluster.discord.guilds
                .filter(g => g.members.get(user.id) !== undefined)
                .map(async guild => {
                    const channel = await this.#getLogChannel('avatarupdate', guild.id);
                    if (channel !== undefined && !await this.#isExempt(guild.id, user.id))
                        await this.#logEvent('avatarupdate', channel, embed);
                })
        );
    }

    async #getContentEmbedField(guildId: string, name: 'old' | 'new' | 'current', content: string | undefined, timestamp: moment.Moment | undefined): Promise<FormatEmbedField<IFormattable<string>>> {
        const names = templates.eventLog.embed.field.content.name[name];
        const values = templates.eventLog.embed.field.content.value;

        switch (content) {
            case undefined: {
                if (await this.#cluster.database.guilds.getSetting(guildId, 'makelogs') !== true)
                    return { name: names.unavailable, value: values.chatLogsOff };
                if (timestamp === undefined)
                    return { name: names.unavailable, value: values.unknown };
                if (timestamp.add(2, 'weeks').isAfter(moment()))
                    return { name: names.unavailable, value: values.expired };
                return { name: names.unavailable, value: values.notLogged };
            }
            case '':
                return { name: names.empty, value: values.empty };
            default:
                return { name: names.default, value: values.default({ content }) };
        }
    }

    async #logMessageDeleted(guildId: string, message: MessageDetails, logChannel: Eris.KnownGuildTextableChannel): Promise<void> {
        const embed = this.#eventLogEmbed(templates.eventLog.events.messageDeleted, message.author, 0xaf1d1d, {
            fields: [
                {
                    name: templates.eventLog.embed.field.message.name,
                    value: templates.eventLog.embed.field.message.value({ messageId: message.id }),
                    inline: true
                },
                {
                    name: templates.eventLog.embed.field.channel.name,
                    value: templates.eventLog.embed.field.channel.value({ channelIds: [message.channelId] }),
                    inline: true
                },
                await this.#getContentEmbedField(guildId, 'current', message.content, undefined)
            ]
        });

        await this.#logEvent('messagedelete', logChannel, embed);
    }

    async #getMessageDetails(message: Eris.KnownMessage | { id: string; channel: { id: string; }; }): Promise<MessageDetails> {
        if ('content' in message)
            return { ...message, authorId: message.author.id, channelId: message.channel.id };

        const chatlog = undefined as ChatLog | undefined;// await this.#cluster.database.chatlogs.getByMessageId(message.id);
        if (chatlog === undefined) {
            return {
                id: message.id,
                author: undefined,
                authorId: undefined,
                channelId: message.channel.id,
                content: undefined
            };
        }

        const user = await this.#cluster.util.getUser(chatlog.userid);
        return {
            id: message.id,
            author: user,
            authorId: chatlog.userid,
            content: chatlog.content,
            channelId: chatlog.channelid
        };
    }

    #eventLogEmbed(title: IFormattable<string>, user: Eris.User | undefined, colour: number, partial: Partial<FormatEmbedOptions<IFormattable<string>>> = {}): FormatEmbedOptions<IFormattable<string>> {
        return {
            ...partial,
            title,
            color: colour,
            author: toEmbedAuthor(this.#cluster.util, user),
            timestamp: new Date()
        };
    }

    async #getLogChannel(type: StoredGuildEventLogType, guildId: string): Promise<Eris.KnownGuildTextableChannel | undefined> {
        const channelId = await this.#cluster.database.guilds.getLogChannel(guildId, type);
        if (channelId === undefined)
            return undefined;

        const channel = await this.#cluster.util.getChannel(channelId);
        if (channel === undefined || !isGuildChannel(channel) || !isTextableChannel(channel) || channel.guild.id !== guildId)
            return undefined;

        return channel;
    }

    async #isExempt(guildId: string, ...userIds: readonly string[]): Promise<boolean> {
        const ignoreUsers = await this.#cluster.database.guilds.getLogIgnores(guildId);
        return userIds.every(id => ignoreUsers.has(id));
    }

    async #logEvent(type: StoredGuildEventLogType, channel: Eris.KnownGuildTextableChannel, embed: FormatEmbedOptions<IFormattable<string>>): Promise<void> {
        const result = await this.#cluster.util.send(channel, new FormattableMessageContent({ embeds: [embed] }));
        if (result !== undefined)
            return;

        if (!await this.#cluster.database.guilds.setLogChannel(channel.guild.id, type, undefined))
            return;

        const defaultChannel = channel.guild.channels.find(isTextableChannel);
        if (defaultChannel !== undefined) {
            await this.#cluster.util.send(defaultChannel, new FormattableMessageContent({
                content: templates.eventLog.disabled({ event: type, channel })
            }));
        }
    }
}

function toEmbedAuthor(util: BaseUtilities, user: Eris.User | undefined): FormatEmbedAuthor<IFormattable<string>> | undefined {
    switch (typeof user) {
        case 'undefined': return undefined;
        case 'object': return util.embedifyAuthor(user, true);
    }
}

async function tryGetAuditLogs(guild: Eris.Guild, limit?: number, before?: string, type?: Eris.AuditLogActionType): Promise<Eris.GuildAuditLog | undefined> {
    try {
        return await guild.getAuditLog({ limit, before, actionType: type });
    } catch (err: unknown) {
        if (err instanceof Eris.DiscordRESTError && err.code === Eris.ApiError.MISSING_PERMISSIONS)
            return undefined;
        throw err;
    }
}

interface MessageDetails {
    id: string;
    author: Eris.User | undefined;
    authorId: string | undefined;
    content: string | undefined;
    channelId: string;
}
