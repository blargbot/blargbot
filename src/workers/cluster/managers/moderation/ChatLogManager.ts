import { Cluster } from '@cluster';
import { guard } from '@cluster/utils';
import { ChatlogType } from '@core/types';
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
            embeds: JSON.stringify(message.embeds),
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
            ? await this.cluster.database.chatlogs.get(message.id)
            : {
                content: message.content,
                embeds: JSON.stringify(message.embeds),
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
            embeds: JSON.stringify(message.embeds),
            guildid: message.channel.guild.id,
            msgid: message.id,
            userid: message.author.id,
            attachment: message.attachments.first()?.url
        }, ChatlogType.UPDATE);
    }
}
