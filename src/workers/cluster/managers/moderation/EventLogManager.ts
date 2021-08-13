import { Cluster } from '@cluster';
import { discordUtil, guard, humanize } from '@cluster/utils';
import { StoredGuildEventLogType } from '@core/types';
import { DiscordAPIError, EmbedFieldData, Guild, GuildAuditLogs, GuildAuditLogsAction, GuildMember, GuildTextBasedChannels, Message, MessageEmbedAuthor, MessageEmbedOptions, PartialMessage, PartialUser, User } from 'discord.js';
import moment from 'moment';
import { Moment } from 'moment-timezone';

export class EventLogManager {
    public constructor(private readonly cluster: Cluster) {
    }

    public async userBanned(guild: Guild, user: User): Promise<void> {
        const channel = await this.getLogChannel('memberban', guild.id);
        if (channel !== undefined && !await this.isExempt(guild.id, user.id))
            await this.logEvent('memberban', channel, this.eventLogEmbed('User was banned', user, 0xcc0c1c));
    }

    public async userUnbanned(guild: Guild, user: User): Promise<void> {
        const channel = await this.getLogChannel('memberunban', guild.id);
        if (channel !== undefined && !await this.isExempt(guild.id, user.id))
            await this.logEvent('memberunban', channel, this.eventLogEmbed('User Was Unbanned', user, 0x17c914));
    }

    public async userJoined(member: GuildMember): Promise<void> {
        const channel = await this.getLogChannel('memberjoin', member.guild.id);
        if (channel !== undefined && !await this.isExempt(member.guild.id, member.user.id)) {
            await this.logEvent('memberjoin', channel, this.eventLogEmbed('User Joined', member.user, 0x1ad8bc, {
                fields: [
                    { name: 'Created', value: `<t:${moment(member.user.createdAt).unix()}>`, inline: true }
                ]
            }));
        }
    }

    public async userLeft(member: GuildMember): Promise<void> {
        const channel = await this.getLogChannel('memberleave', member.guild.id);
        if (channel !== undefined && !await this.isExempt(member.guild.id, member.user.id))
            await this.logEvent('memberleave', channel, this.eventLogEmbed('User Left', member.user, 0xd8761a));
    }

    public async messagesDeleted(messages: ReadonlyArray<Message | PartialMessage>): Promise<void> {
        if (messages.length === 0)
            return;

        const guildId = 'guild' in messages[0].channel ? messages[0].channel.guild.id : undefined;
        if (guildId === undefined)
            return;

        const logChannel = await this.getLogChannel('messagedelete', guildId);
        if (logChannel === undefined)
            return;

        const details = await Promise.all(messages.map(m => this.getMessageDetails(m)));
        const authorIds = details.map(d => d.authorId).filter(guard.hasValue);
        if (authorIds.length > 0 && await this.isExempt(guildId, ...authorIds))
            return;

        await Promise.all(details.map(d => this.logMessageDeleted(guildId, d, logChannel)));
        await this.logEvent('messagedelete', logChannel, this.eventLogEmbed('Message Deleted', undefined, 0xaf1d1d, {
            description: 'Bulk Message Delete',
            fields: [
                { name: 'Count', value: `${messages.length}`, inline: true },
                { name: 'Channel', value: messages.map(m => `<#${m.channel.id}>`).join('\n'), inline: true }
            ]
        }));
    }

    public async messageDeleted(message: Message | PartialMessage): Promise<void> {
        const guildId = 'guild' in message.channel ? message.channel.guild.id : undefined;
        if (guildId === undefined)
            return;

        const logChannel = await this.getLogChannel('messagedelete', guildId);
        if (logChannel === undefined)
            return;

        const details = await this.getMessageDetails(message);
        if (details.authorId !== undefined && await this.isExempt(guildId, details.authorId))
            return;

        await this.logMessageDeleted(guildId, details, logChannel);
    }

    public async messageUpdated(message: Message | PartialMessage, oldMessage: Message | PartialMessage): Promise<void> {
        const guildId = guard.isGuildMessage(message) ? message.channel.guild.id : undefined;
        if (guildId === undefined)
            return;

        const logChannel = await this.getLogChannel('messageupdate', guildId);
        if (logChannel === undefined || message.author !== null && await this.isExempt(guildId, message.author.id))
            return;

        const lastUpdate = moment(message.editedTimestamp ?? message.createdAt);

        const embed = this.eventLogEmbed('Message Updated', message.author ?? undefined, 0x771daf, {
            fields: [
                { name: 'Message Id', value: message.id, inline: true },
                { name: 'Channel', value: message.channel.toString(), inline: true },
                await this.getContentEmbedField(guildId, 'Old Message', oldMessage.content ?? undefined, lastUpdate, 2),
                await this.getContentEmbedField(guildId, 'New Message', message.content ?? undefined, lastUpdate, 2)
            ]
        });
        await this.logEvent('messageupdate', logChannel, embed);
    }

    public async roleRemoved(member: GuildMember, roleId: string): Promise<void> {
        const channel = await this.getLogChannel(`role:${roleId}`, member.guild.id);
        if (channel === undefined || await this.isExempt(member.guild.id, member.user.id))
            return;

        const now = moment();
        const auditEvents = await tryGetAuditLogs(member.guild, 50, undefined, 'ROLE_UPDATE');
        const audit = auditEvents?.entries.find(e => e.target === member && moment(e.createdAt).isAfter(now.add(-1, 'second')));
        const reason = audit?.reason ?? undefined;
        const moderator = audit?.executor ?? undefined;
        await this.logEvent(`role:${roleId}`, channel, this.eventLogEmbed('Special Role Removed', member.user, 0, {
            fields: [
                { name: 'Role', value: `<@&${roleId}> (${roleId})`, inline: true },
                ...moderator !== undefined ? [{ name: 'Updated By', value: `<@${moderator.id}> (${moderator.id})`, inline: true }] : [],
                ...reason !== undefined ? [{ name: 'Reason', value: reason, inline: true }] : []
            ]
        }));
    }

    public async roleAdded(member: GuildMember, roleId: string): Promise<void> {
        const channel = await this.getLogChannel(`role:${roleId}`, member.guild.id);
        if (channel === undefined || await this.isExempt(member.guild.id, member.user.id))
            return;

        const now = moment();
        const auditEvents = await tryGetAuditLogs(member.guild, 50, undefined, 'ROLE_UPDATE');
        const audit = auditEvents?.entries.find(e => e.target === member && moment(e.createdAt).isAfter(now.add(-1, 'second')));
        const reason = audit?.reason ?? undefined;
        const moderator = audit?.executor ?? undefined;
        await this.logEvent(`role:${roleId}`, channel, this.eventLogEmbed('Special Role Added', member.user, 0, {
            fields: [
                { name: 'Role', value: `<@&${roleId}> (${roleId})`, inline: true },
                ...moderator !== undefined ? [{ name: 'Updated By', value: `<@${moderator.id}> (${moderator.id})`, inline: true }] : [],
                ...reason !== undefined ? [{ name: 'Reason', value: reason, inline: true }] : []
            ]
        }));
    }

    public async nicknameUpdated(member: GuildMember, oldNickname: string | undefined): Promise<void> {
        const channel = await this.getLogChannel('nickupdate', member.guild.id);
        if (channel !== undefined && !await this.isExempt(member.guild.id, member.user.id)) {
            await this.logEvent('nickupdate', channel, this.eventLogEmbed('Nickname Updated', member.user, 0xd8af1a, {
                fields: [
                    { name: 'Old Nickname', value: oldNickname ?? member.user.username, inline: true },
                    { name: 'New Nickname', value: member.nickname ?? member.user.username, inline: true }
                ]
            }));
        }
    }

    public async userTagUpdated(user: User, oldUser: PartialUser | User): Promise<void> {
        const embed = this.eventLogEmbed('Username Updated', user, 0xd8af1a, {
            fields: [
                { name: 'Old Name', value: humanize.fullName(oldUser), inline: true },
                { name: 'New Name', value: humanize.fullName(user), inline: true }
            ]
        });

        await Promise.all(
            this.cluster.discord.guilds.cache
                .map(async guild => {
                    if (await this.cluster.util.getMemberById(guild, user.id) === undefined)
                        return;

                    const channel = await this.getLogChannel('nameupdate', guild.id);
                    if (channel !== undefined && !await this.isExempt(guild.id, user.id))
                        await this.logEvent('nameupdate', channel, embed);
                })
        );
    }

    public async userAvatarUpdated(user: User, oldUser: PartialUser | User): Promise<void> {
        const oldUserInstance = new User(this.cluster.discord, {
            id: user.id,
            avatar: oldUser.avatar,
            discriminator: oldUser.discriminator ?? user.discriminator,
            username: oldUser.username ?? user.username
        });

        const embed = this.eventLogEmbed('Avatar Updated', user, 0xd8af1a, {
            image: { url: user.displayAvatarURL({ dynamic: true }) },
            thumbnail: { url: oldUserInstance.displayAvatarURL({ dynamic: true }) },
            description: '➡️ Old avatar\n⬇️ New avatar'
        });

        await Promise.all(
            this.cluster.discord.guilds.cache
                .map(async guild => {
                    if (await this.cluster.util.getMemberById(guild, user.id) === undefined)
                        return;

                    const channel = await this.getLogChannel('avatarupdate', guild.id);
                    if (channel !== undefined && !await this.isExempt(guild.id, user.id))
                        await this.logEvent('avatarupdate', channel, embed);
                })
        );

    }

    private async getContentEmbedField(guildId: string, name: string, content: string | undefined, timestamp: Moment | undefined, contentCount = 1): Promise<EmbedFieldData> {
        switch (content) {
            case undefined: {
                if (await this.cluster.database.guilds.getSetting(guildId, 'makelogs') !== true)
                    return { name: name + ' (Unavailable)', value: 'This message wasnt logged. Chatlogging is currently turned off' };
                if (timestamp === undefined)
                    return { name: name + ' (Unavailable)', value: 'This message wasnt logged. Chatlogging was off when it was sent, or it is older than 2 weeks' };
                if (timestamp.add(2, 'weeks').isAfter(moment()))
                    return { name: name + ' (Unavailable)', value: 'This message is no longer logged as it is older than 2 weeks' };
                return { name: name + ' (Unavailable)', value: 'This message wasnt logged. Chatlogging was off when it was sent.' };
            }
            case '':
                return { name: name + ' (Empty)', value: 'This message has no content. It had either an attachment or an embed' };
            default:
                return { name, value: discordUtil.overflowText('embed.field.value', content, '... (too long to display)', l => l / contentCount) };
        }
    }

    private async logMessageDeleted(guildId: string, message: MessageDetails, logChannel: GuildTextBasedChannels): Promise<void> {
        const embed = this.eventLogEmbed('Message Deleted', message.author, 0xaf1d1d, {
            fields: [
                { name: 'Message Id', value: message.id, inline: true },
                { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
                await this.getContentEmbedField(guildId, 'Content', message.content, undefined)
            ]
        });

        await this.logEvent('messagedelete', logChannel, embed);
    }

    private async getMessageDetails(message: Message | { id: string; channel: { id: string; }; }): Promise<MessageDetails> {
        if ('content' in message)
            return { ...message, authorId: message.author.id, channelId: message.channel.id };

        const chatlog = await this.cluster.database.chatlogs.get(message.id);
        if (chatlog === undefined) {
            return {
                id: message.id,
                author: undefined,
                authorId: undefined,
                channelId: message.channel.id,
                content: undefined
            };
        }

        return {
            id: message.id,
            author: chatlog.userid,
            authorId: chatlog.userid,
            content: chatlog.content,
            channelId: chatlog.channelid
        };
    }

    private eventLogEmbed(title: string, user: User | string | undefined, colour: number, partial: Partial<MessageEmbedOptions> = {}): MessageEmbedOptions {
        return {
            ...partial,
            title: `ℹ️ ${title}`,
            color: colour,
            author: toEmbedAuthor(user),
            timestamp: new Date()
        };
    }

    private async getLogChannel(type: StoredGuildEventLogType, guildId: string): Promise<GuildTextBasedChannels | undefined> {
        const channelId = await this.cluster.database.guilds.getLogChannel(guildId, type);
        if (channelId === undefined)
            return undefined;

        const channel = await this.cluster.util.getChannelById(channelId);
        if (channel === undefined || !guard.isGuildChannel(channel) || !guard.isTextableChannel(channel) || channel.guild.id !== guildId)
            return undefined;

        return channel;
    }

    private async isExempt(guildId: string, ...userIds: readonly string[]): Promise<boolean> {
        const ignoreUsers = await this.cluster.database.guilds.getLogIgnores(guildId);
        return userIds.every(id => ignoreUsers.has(id));
    }

    private async logEvent(type: StoredGuildEventLogType, channel: GuildTextBasedChannels, embed: MessageEmbedOptions): Promise<void> {
        const result = await this.cluster.util.send(channel, { embeds: [embed] });
        if (result !== undefined)
            return;

        if (!await this.cluster.database.guilds.setLogChannel(channel.guild.id, type, undefined))
            return;

        const defaultChannel = channel.guild.channels.cache.find(guard.isTextableChannel);
        if (defaultChannel !== undefined)
            await this.cluster.util.send(defaultChannel, `❌ Disabled logging of the \`${type}\` event because the channel <#${channel.id}> doesnt exist or I dont have permission to post messages in it!`);
    }
}

function toEmbedAuthor(user: string | User | undefined): MessageEmbedAuthor | undefined {
    switch (typeof user) {
        case 'undefined': return undefined;
        case 'string': return {
            name: `${humanize.fullName({})} (${user})`
        };
        case 'object': return {
            name: `${humanize.fullName(user)} (${user.id})`,
            iconURL: user.displayAvatarURL({ dynamic: true })
        };
    }
}

async function tryGetAuditLogs(guild: Guild, limit?: number, before?: string, type?: GuildAuditLogsAction): Promise<GuildAuditLogs | undefined> {
    try {
        return await guild.fetchAuditLogs({ limit, before, type });
    } catch (err: unknown) {
        if (err instanceof DiscordAPIError && err.code === 50013 /* Missing Permissions */)
            return undefined;
        throw err;
    }
}

interface MessageDetails {
    id: string;
    author: string | User | undefined;
    authorId: string | undefined;
    content: string | undefined;
    channelId: string;
}
