import { Cluster } from '@blargbot/cluster';
import { guard, snowflake } from '@blargbot/cluster/utils/index.js';
import { ChatLog, ChatLogIndex, ChatLogSearchOptions, ChatLogType } from '@blargbot/domain/models/index.js';
import Eris from 'eris';

export class ChatLogManager {
    public constructor(
        protected readonly cluster: Cluster
    ) {

    }

    public async messageCreated(message: Eris.KnownMessage): Promise<void> {
        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        await this.cluster.database.chatlogs.add({
            channelid: message.channel.id,
            content: message.content,
            embeds: message.embeds,
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: message.author.id,
            attachments: message.attachments.map(a => a.url)
        }, ChatLogType.CREATE);
    }

    public async messageDeleted(message: Eris.PossiblyUncachedMessage): Promise<void> {
        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        const chatlog = message instanceof Eris.Message
            ? {
                content: message.content,
                embeds: message.embeds,
                userid: message.author.id,
                attachments: message.attachments.map(a => a.url)
            }
            : await this.cluster.database.chatlogs.getByMessageId(message.id);
        if (chatlog === undefined)
            return;

        await this.cluster.database.chatlogs.add({
            channelid: message.channel.id,
            content: chatlog.content,
            embeds: chatlog.embeds,
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: chatlog.userid,
            attachments: chatlog.attachments
        }, ChatLogType.DELETE);
    }

    public async messageUpdated(message: Eris.Message<Eris.PossiblyUncachedTextableChannel>): Promise<void> {
        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true || !guard.hasValue(message.author))
            return;

        await this.cluster.database.chatlogs.add({
            channelid: message.channel.id,
            content: message.content,
            embeds: message.embeds,
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: message.author.id,
            attachments: message.attachments.map(a => a.url)
        }, ChatLogType.UPDATE);
    }

    public async find(options: ChatLogSearchOptions): Promise<readonly ChatLog[]> {
        return await this.cluster.database.chatlogs.findAll(options);
    }

    public async createIndex(options: ChatLogSearchOptions): Promise<ChatLogIndex<ChatLog>> {
        const chatlogs = await this.cluster.database.chatlogs.findAll(options);
        const key = snowflake.create().toString();

        const channel = await this.cluster.util.getChannel(options.channelId);

        let channelName = '';
        let guildName = '';
        if (channel !== undefined && guard.isGuildChannel(channel)) {
            channelName = channel.name;
            guildName = channel.guild.name;
        }

        const result: ChatLogIndex = {
            keycode: key,
            channel: options.channelId,
            channelName,
            guildName,
            ids: chatlogs.map(l => l.id.toString()),
            limit: options.count,
            types: options.types,
            users: options.users
        };
        await this.cluster.database.chatlogIndex.add(result);
        return { ...result, ids: chatlogs };
    }

    public async getIndex(id: string): Promise<ChatLogIndex<ChatLog> | undefined> {
        const index = await this.cluster.database.chatlogIndex.get(id);
        if (index === undefined)
            return undefined;

        const chatlogs = await this.cluster.database.chatlogs.getAll(index.channel, index.ids);
        return { ...index, ids: chatlogs };
    }
}
