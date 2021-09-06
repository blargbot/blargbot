import { ClusterUtilities } from '@cluster/ClusterUtilities';
import { guard } from '@cluster/utils';
import { metrics } from '@core/Metrics';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

export class CleverbotMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly util: ClusterUtilities) {
    }

    public async execute(context: Message, next: () => Promise<boolean>): Promise<boolean> {
        if (await next())
            return true;

        if (guard.isGuildMessage(context)) {
            if (!new RegExp(`^<@!?${this.util.discord.user.id}>`).test(context.content))
                return false;

            if (await this.util.database.guilds.getSetting(context.channel.guild.id, 'nocleverbot') === true)
                return false;
        }

        await this.reply(context);
        return true;
    }

    private async reply(context: Message): Promise<void> {
        metrics.cleverbotStats.inc();
        await context.channel.sendTyping();
        const query = await this.util.resolveTags(context, context.content);
        try {
            await this.util.send(context, await this.queryCleverbot(query));
        } catch (err: unknown) {
            this.util.logger.error(err);
            await this.util.send(context, '❌ It seems that my clever brain isnt working right now, try again later');
        }
    }

    private async queryCleverbot(message: string): Promise<string> {
        const form = new URLSearchParams();
        form.append('input', message);

        const result = await fetch(this.util.config.general.cleverbotApi, {
            method: 'POST',
            body: form
        });
        const content = /<font size="2" face="Verdana" color=darkred>(.+)<\/font>/.exec(await result.text());
        if (content !== null)
            return content[1].replace(/\balice\b/gi, 'blargbot').replace(/<br>/gm, '\n');
        return 'Hi, I\'m blargbot! It\'s nice to meet you.';
    }
}
