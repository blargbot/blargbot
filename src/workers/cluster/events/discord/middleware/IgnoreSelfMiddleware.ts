import { guard } from '@cluster/utils';
import { Logger } from '@core/Logger';
import { metrics } from '@core/Metrics';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class IgnoreSelfMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly logger: Logger) {
    }

    public async execute(context: Message, next: () => Awaitable<boolean>): Promise<boolean> {
        if (context.author.id !== context.client.user?.id) {
            metrics.messageCounter.inc();
            return await next();
        }

        const channel = context.channel;
        if (guard.isGuildChannel(channel)) {
            const guild = channel.guild;
            this.logger.output(`${guild.name} (${guild.id})> ${channel.name} (${channel.id})> ${context.author.username}> ${context.content} (${context.id})`);
        } else if (guard.isPrivateChannel(channel)) {
            const recipient = channel.recipient;
            this.logger.output(`PM> ${recipient.username} (${recipient.id})> (${channel.id})> ${context.author.username}> ${context.content} (${context.id})`);
        }

        return false;
    }
}
