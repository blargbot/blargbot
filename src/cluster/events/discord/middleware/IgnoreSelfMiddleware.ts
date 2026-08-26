import { guard } from '@blargbot/cluster/utils/index.js';
import { metrics } from '@blargbot/core/Metrics.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import type { Logger } from '@blargbot/logger';
import type * as eris from 'eris';

export class IgnoreSelfMiddleware implements IMiddleware<eris.KnownMessage, boolean> {
    readonly #discord: eris.Client;
    readonly #logger: Logger;

    public constructor(logger: Logger, discord: eris.Client) {
        this.#discord = discord;
        this.#logger = logger;
    }

    public async execute(context: eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (context.author.id !== this.#discord.user.id) {
            metrics.messageCounter.inc();
            return await next();
        }

        const channel = context.channel;
        if (guard.isGuildChannel(channel)) {
            const guild = channel.guild;
            this.#logger.output(`${guild.name} (${guild.id})> ${channel.name} (${channel.id})> ${context.author.username}> ${context.content} (${context.id})`);
        } else if (guard.isPrivateChannel(channel)) {
            const recipient = channel.recipient;
            this.#logger.output(`PM> ${recipient.username} (${recipient.id})> (${channel.id})> ${context.author.username}> ${context.content} (${context.id})`);
        }

        return false;
    }
}
