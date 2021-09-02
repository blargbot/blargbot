import { Cluster } from '@cluster';
import { guard } from '@cluster/utils';
import { metrics } from '@core/Metrics';
import { DiscordEventService } from '@core/serviceTypes';
import { Message, TextBasedChannels, User } from 'discord.js';

import { handleTableFlip, tryHandleCleverbot } from '../features';

export class DiscordMessageCreateHandler extends DiscordEventService<'messageCreate'> {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageCreate', cluster.logger);
    }

    public async execute(message: Message): Promise<void> {
        await Promise.all(await this.executeIter(message));
    }

    protected async executeIter(message: Message): Promise<Array<Promise<unknown>>> {
        const result: Array<Promise<unknown>> = [];
        if (message.author.id === this.cluster.discord.user.id) {
            this.logMessage(message);
            return result;
        }

        metrics.messageCounter.inc();
        result.push(
            this.cluster.database.users.upsert(message.author),
            this.cluster.moderation.chatLog.messageCreated(message)
        );

        if (guard.isGuildMessage(message) && await this.cluster.moderation.censors.censor(message))
            return result;

        if (await this.isBlacklisted(message.channel, message.author))
            return result;

        result.push(
            this.cluster.rolemes.execute(message),
            this.cluster.autoresponses.execute(message, true),
            handleTableFlip(this.cluster, message)
        );

        if (message.author.bot) {
            // NOOP
        } else if (!await this.cluster.await.messages.checkMessage(message)) {
            if (await this.cluster.commands.tryExecute(message) || await tryHandleCleverbot(this.cluster, message)) {
                return result;
            }
        }

        result.push(this.cluster.autoresponses.execute(message, false));
        return result;
    }

    private logMessage(msg: Message): void {
        const channel = msg.channel;
        if (guard.isGuildChannel(channel)) {
            const guild = channel.guild;
            this.logger.output(`${guild.name} (${guild.id})> ${channel.name} (${channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        } else if (guard.isPrivateChannel(channel)) {
            const recipient = channel.recipient;
            this.logger.output(`PM> ${recipient.username} (${recipient.id})> (${channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        }
    }

    private async isBlacklisted(channel: TextBasedChannels, user: User): Promise<boolean> {
        return guard.isGuildChannel(channel)
            && (await this.cluster.database.guilds.getChannelSetting(channel.guild.id, channel.id, 'blacklisted') ?? false)
            && !await this.cluster.util.isUserStaff(user.id, channel.guild.id);
    }
}
