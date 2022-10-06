import { Cluster } from '@blargbot/cluster';
import { CommandContext } from '@blargbot/cluster/command';
import { CommandResult } from '@blargbot/cluster/types';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { humanize, pluralise as p, runMiddleware } from '@blargbot/core/utils';
import { KnownMessage } from 'eris';

export class CommandMiddleware implements IMiddleware<KnownMessage, boolean> {
    readonly #cluster: Cluster;
    readonly #middleware: ReadonlyArray<IMiddleware<CommandContext, CommandResult>>;

    public constructor(
        cluster: Cluster,
        middleware: ReadonlyArray<IMiddleware<CommandContext, CommandResult>>
    ) {
        this.#cluster = cluster;
        this.#middleware = middleware;
    }

    public async execute(message: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const prefix = await this.#cluster.prefixes.findPrefix(message);
        if (prefix === undefined)
            return await next();

        const commandText = message.content.slice(prefix.length);
        const parts = humanize.smartSplit(commandText, 2);
        const commandName = (parts[0] ?? ``).toLowerCase();
        const argsString = parts[1] ?? ``;

        const result = await this.#cluster.commands.get(commandName, message.channel, message.author);
        switch (result.state) {
            case `ALLOWED`: {
                const context = new CommandContext(this.#cluster, message, commandText, prefix, commandName, argsString, result.detail.command);
                const output = await runMiddleware([...this.#middleware, result.detail.command], context, next, () => undefined);
                if (output !== undefined)
                    await context.reply(output);

                return true;
            }
            case `DISABLED`:
            case `NOT_FOUND`:
            case `NOT_IN_GUILD`:
                return await next();
            case `BLACKLISTED`:
                await this.#cluster.util.send(message, `❌ You have been blacklisted from the bot for the following reason: ${result.detail.reason}`);
                return true;
            case `MISSING_ROLE`:
                await this.#cluster.util.send(message, `❌ You need the role ${humanize.smartJoin(result.detail.reason.map(r => `<@&${r}>`), `, `, ` or `)} in order to use this command!`);
                return true;
            case `MISSING_PERMISSIONS`: {
                const permissions = humanize.permissions(result.detail.reason, true).map(m => `- \`${m}\``);
                await this.#cluster.util.send(message, `❌ You need ${p(permissions.length, `the following permission`, `any of the following permissions`)} to use this command:\n${permissions.join(`\n`)}`);
                return true;
            }
        }
    }
}
