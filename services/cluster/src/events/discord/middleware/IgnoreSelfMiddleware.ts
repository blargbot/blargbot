import { metrics } from '@blargbot/core/Metrics.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import { isGuildChannel, isPrivateChannel } from '@blargbot/discord-util';
import type { Logger } from '@blargbot/logger';
import type * as Eris from 'eris';

export class IgnoreSelfMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    readonly #discord: Eris.Client;
    readonly #logger: Logger;

    public constructor(logger: Logger, discord: Eris.Client) {
        this.#discord = discord;
        this.#logger = logger;
    }

    public async execute(context: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (context.author.id !== this.#discord.user.id) {
            metrics.messageCounter.inc();
            return await next();
        }

        const channel = context.channel;
        if (isGuildChannel(channel)) {
            const guild = channel.guild;
            this.#logger.output(`${guild.name} (${guild.id})> ${channel.name} (${channel.id})> ${context.author.username}> ${context.content} (${context.id})`);
        } else if (isPrivateChannel(channel)) {
            const recipient = channel.recipient;
            this.#logger.output(`PM> ${recipient.username} (${recipient.id})> (${channel.id})> ${context.author.username}> ${context.content} (${context.id})`);
        }

        return false;
    }
}
