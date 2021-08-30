import { Cluster } from '@cluster';
import { guard, snowflake } from '@cluster/utils';
import { Chatlog, ChatlogIndex, ChatlogSearchOptions, ChatlogType } from '@core/types';
import { Message, PartialMessage } from 'discord.js';

export class ChatLogManager {
    public constructor(
        protected readonly cluster: Cluster
    ) {

    }

    public async messageCreated(message: Message): Promise<void> {
        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        await this.cluster.database.chatlogs.add({
            channelid: message.channel.id,
            content: message.content,
            embeds: message.embeds.map(e => e.toJSON()),
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: message.author.id,
            attachment: message.attachments.first()?.url
        }, ChatlogType.CREATE);
    }

    public async messageDeleted(message: Message | PartialMessage): Promise<void> {
        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        const chatlog = message.partial
            ? await this.cluster.database.chatlogs.getByMessageId(message.id)
            : {
                content: message.content,
                embeds: message.embeds.map(e => e.toJSON()),
                userid: message.author.id,
                attachment: message.attachments.first()?.url
            };
        if (chatlog === undefined)
            return;

        await this.cluster.database.chatlogs.add({
            channelid: message.channel.id,
            content: chatlog.content,
            embeds: chatlog.embeds,
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: chatlog.userid,
            attachment: chatlog.attachment
        }, ChatlogType.DELETE);
    }

    public async messageUpdated(message: Message | PartialMessage): Promise<void> {
        if (message.partial)
            return;

        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        await this.cluster.database.chatlogs.add({
            channelid: message.channel.id,
            content: message.content,
            embeds: message.embeds.map(e => e.toJSON()),
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: message.author.id,
            attachment: message.attachments.first()?.url
        }, ChatlogType.UPDATE);
    }

    public async find(options: ChatlogSearchOptions): Promise<readonly Chatlog[]> {
        return await this.cluster.database.chatlogs.findAll(options);
    }

    public async createIndex(options: ChatlogSearchOptions): Promise<ChatlogIndex<Chatlog>> {
        const chatlogs = await this.cluster.database.chatlogs.findAll(options);
        const key = snowflake.create().toString();
        const result = {
            keycode: key,
            channel: options.channelId,
            ids: chatlogs.map(l => l.id.toString()),
            limit: options.count,
            types: options.types,
            users: options.users
        };
        await this.cluster.database.chatlogIndex.add(result);
        return { ...result, ids: chatlogs };
    }

    public async getIndex(id: string): Promise<ChatlogIndex<Chatlog> | undefined> {
        const index = await this.cluster.database.chatlogIndex.get(id);
        if (index === undefined)
            return undefined;

        const chatlogs = await this.cluster.database.chatlogs.getAll(index.channel, index.ids);
        return { ...index, ids: chatlogs };
    }
}
