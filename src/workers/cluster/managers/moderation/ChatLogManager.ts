import { AnyMessage, PossiblyUncachedMessage } from 'eris';
import { Cluster } from '../../Cluster';
import { ChatlogType, guard } from '../../core';

export class ChatLogManager {
    public constructor(
        protected readonly cluster: Cluster
    ) {

    }

    public async messageCreated(message: AnyMessage): Promise<void> {
        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        await this.cluster.database.chatlogs.add({
            channelid: message.channel.id,
            content: message.content,
            embeds: JSON.stringify(message.embeds),
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: message.author.id,
            attachment: message.attachments[0]?.url
        }, ChatlogType.CREATE);
    }

    public async messageDeleted(message: PossiblyUncachedMessage): Promise<void> {
        if (!('guild' in message.channel) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        const chatlog = 'content' in message
            ? { content: message.content, embeds: JSON.stringify(message.embeds), userid: message.author.id, attachment: message.attachments[0]?.url }
            : await this.cluster.database.chatlogs.get(message.id);
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

    public async messageUpdated(message: AnyMessage): Promise<void> {
        if (!guard.isGuildMessage(message) || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'makelogs') !== true)
            return;

        await this.cluster.database.chatlogs.add({
            channelid: message.channel.id,
            content: message.content,
            embeds: JSON.stringify(message.embeds),
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: message.author.id,
            attachment: message.attachments[0]?.url
        }, ChatlogType.UPDATE);
    }
}
