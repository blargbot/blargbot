import { ClusterUtilities } from '@blargbot/cluster/ClusterUtilities';
import { guard } from '@blargbot/cluster/utils';
import { metrics } from '@blargbot/core/Metrics';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { KnownMessage } from 'eris';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

export class CleverbotMiddleware implements IMiddleware<KnownMessage, boolean> {
    public constructor(private readonly util: ClusterUtilities) {
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (await next())
            return true;

        if (!guard.isGuildMessage(context))
            return false;

        if (!new RegExp(`^<@!?${this.util.discord.user.id}>`).test(context.content))
            return false;

        if (await this.util.database.guilds.getSetting(context.channel.guild.id, 'nocleverbot') === true)
            return false;

        await this.reply(context);
        return true;
    }

    private async reply(context: KnownMessage): Promise<void> {
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
