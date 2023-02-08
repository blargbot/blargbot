import { URLSearchParams } from 'node:url';

import type { ClusterUtilities } from '@blargbot/cluster/ClusterUtilities.js';
import { guard } from '@blargbot/cluster/utils/index.js';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import { metrics } from '@blargbot/core/Metrics.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import { markup } from '@blargbot/discord-util';
import { util } from '@blargbot/formatting';
import type * as Eris from 'eris';
import fetch from 'node-fetch';

import templates from '../../../text.js';

export class CleverbotMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    readonly #util: ClusterUtilities;

    public constructor(util: ClusterUtilities) {
        this.#util = util;
    }

    public async execute(context: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (await next())
            return true;

        if (!guard.isGuildMessage(context))
            return false;

        if (!markup.user.pattern.start.test(context.content))
            return false;

        if (await this.#util.database.guilds.getSetting(context.channel.guild.id, 'nocleverbot') === true)
            return false;

        await this.#reply(context);
        return true;
    }

    async #reply(context: Eris.KnownMessage): Promise<void> {
        metrics.cleverbotStats.inc();
        await context.channel.sendTyping();
        const query = await this.#util.resolveTags(context.content, context.channel);
        try {
            await this.#util.reply(context, new FormattableMessageContent({ content: util.literal(await this.#queryCleverbot(query)) }));
        } catch (err: unknown) {
            this.#util.logger.error(err);
            await this.#util.reply(context, new FormattableMessageContent({ content: templates.cleverbot.unavailable }));
        }
    }

    async #queryCleverbot(message: string): Promise<string> {
        const form = new URLSearchParams();
        form.append('input', message);

        const result = await fetch(this.#util.config.general.cleverbotApi, {
            method: 'POST',
            body: form
        });
        const content = /<font size="2" face="Verdana" color=darkred>(.+)<\/font>/.exec(await result.text());
        if (content !== null)
            return content[1].replace(/\balice\b/gi, 'blargbot').replace(/<br>/gm, '\n');
        return 'Hi, I\'m blargbot! It\'s nice to meet you.';
    }
}
