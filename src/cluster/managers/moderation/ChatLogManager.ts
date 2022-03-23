import { Cluster } from '@blargbot/cluster';
import { guard, snowflake } from '@blargbot/cluster/utils';
import { Chatlog, ChatlogIndex, ChatlogSearchOptions, ChatlogType } from '@blargbot/core/types';
import { GuildChannel, KnownMessage, Message, PossiblyUncachedMessage, PossiblyUncachedTextableChannel  } from 'eris';

export class ChatLogManager {
    public constructor(
        protected readonly cluster: Cluster
    ) {

    }

    public async messageCreated(message: KnownMessage): Promise<void> {
        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        await this.cluster.database.chatlogs.add({
            channelid: message.channel.id,
            content: message.content,
            embeds: message.embeds,
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: message.author.id,
            attachment: message.attachments[0]?.url
        }, ChatlogType.CREATE);
    }

    public async messageDeleted(message: PossiblyUncachedMessage): Promise<void> {
        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        const chatlog = message instanceof Message
            ? {
                content: message.content,
                embeds: message.embeds,
                userid: message.author.id,
                attachment: message.attachments[0]?.url
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
            attachment: chatlog.attachment
        }, ChatlogType.DELETE);
    }

    public async messageUpdated(message: Message<PossiblyUncachedTextableChannel>): Promise<void> {
        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        await this.cluster.database.chatlogs.add({
            channelid: message.channel.id,
            content: message.content,
            embeds: message.embeds,
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: message.author.id,
            attachment: message.attachments[0]?.url
        }, ChatlogType.UPDATE);
    }

    public async find(options: ChatlogSearchOptions): Promise<readonly Chatlog[]> {
        return await this.cluster.database.chatlogs.findAll(options);
    }

    public async createIndex(options: ChatlogSearchOptions): Promise<ChatlogIndex<Chatlog>> {
        const chatlogs = await this.cluster.database.chatlogs.findAll(options);
        const key = snowflake.create().toString();

        const channel = await this.cluster.util.getChannel(options.channelId);

        let channelName = '';
        let guildName = '';
        if (channel !== undefined && channel instanceof GuildChannel) {
            channelName = channel.name;
            guildName = channel.guild.name;
        }

        const result = {
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

    public async getIndex(id: string): Promise<ChatlogIndex<Chatlog> | undefined> {
        const index = await this.cluster.database.chatlogIndex.get(id);
        if (index === undefined)
            return undefined;

        const chatlogs = await this.cluster.database.chatlogs.getAll(index.channel, index.ids);
        return { ...index, ids: chatlogs };
    }
}
