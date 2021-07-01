import { AnyMessage, Channel, User } from 'eris';
import { guard } from '../../utils';
import { Cluster } from '../Cluster';
import { DiscordEventService } from '../../structures/DiscordEventService';
import { metrics } from '../../core/Metrics';
import { addChatlog, handleAntiMention, handleAutoresponse, handleCensor, handleRoleme, handleTableFlip, tryHandleCommand } from '../features';

export class MessageCreateHandler extends DiscordEventService<'messageCreate'> {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageCreate', cluster.logger);
    }

    protected async execute(message: AnyMessage): Promise<void> {
        void this.cluster.database.users.upsert(message.author);
        void addChatlog(this.cluster, message);
        metrics.messageCounter.inc();

        if (message.author.id === this.cluster.discord.user.id) {
            this.logMessage(message);
            return;
        }

        void handleCensor(this.cluster, message);
        void handleAntiMention(this.cluster, message);
        if (await this.isBlacklisted(message.channel, message.author))
            return;

        void handleRoleme(this.cluster, message);
        void handleAutoresponse(this.cluster, message, true);
        void handleTableFlip(this.cluster, message);

        if (message.author.bot) {
            //
        } else if (await tryHandleCommand(this.cluster, message)) {
            return;
        } else {
            this.cluster.util.messageAwaiter.emit(message);
        }

        void handleAutoresponse(this.cluster, message, false);
    }

    private logMessage(msg: AnyMessage): void {
        const channel = msg.channel;
        if (guard.isGuildChannel(channel)) {
            const guild = channel.guild;
            this.logger.output(`${guild.name} (${guild.id})> ${channel.name} (${channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        } else if (guard.isPrivateChannel(channel)) {
            const recipient = channel.recipient;
            this.logger.output(`PM> ${recipient.username} (${recipient.id})> (${channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        } else {
            this.logger.output(`??> (${channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        }
    }

    private async isBlacklisted(channel: Channel, user: User): Promise<boolean> {
        return guard.isGuildChannel(channel)
            && (await this.cluster.database.guilds.getChannelSetting(channel.guild.id, channel.id, 'blacklisted') ?? false)
            && !await this.cluster.util.isUserStaff(user.id, channel.guild.id);
    }
}