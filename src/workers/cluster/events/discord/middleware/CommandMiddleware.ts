import { Cluster } from '@cluster';
import { CommandContext } from '@cluster/command';
import { CommandResult } from '@cluster/types';
import { IMiddleware, NextMiddleware } from '@core/types';
import { humanize, pluralise as p, runMiddleware } from '@core/utils';
import { Message } from 'discord.js';

export class CommandMiddleware implements IMiddleware<Message, boolean> {
    public constructor(
        private readonly cluster: Cluster,
        private readonly middleware: ReadonlyArray<IMiddleware<CommandContext, CommandResult>>
    ) {
    }

    public async execute(message: Message, next: NextMiddleware<boolean>): Promise<boolean> {
        const prefix = await this.cluster.prefixes.findPrefix(message);
        if (prefix === undefined)
            return await next();

        const commandText = message.content.slice(prefix.length);
        const parts = humanize.smartSplit(commandText, 2);
        const commandName = parts[0].toLowerCase();
        const argsString = parts[1] ?? '';

        const command = await this.cluster.commands.get(commandName, message.channel, message.author);
        switch (command.state) {
            case 'ALLOWED': {
                const context = new CommandContext(this.cluster, message, commandText, prefix, commandName, argsString, command.detail);
                const output = await runMiddleware([...this.middleware, command.detail], context, next, () => undefined);
                if (output !== undefined)
                    await context.reply(output);

                return true;
            }
            case 'DISABLED':
            case 'NOT_FOUND':
            case 'NOT_IN_GUILD':
                return await next();
            case 'BLACKLISTED':
                await this.cluster.util.send(message, `❌ You have been blacklisted from the bot for the following reason: ${command.detail}`);
                return true;
            case 'MISSING_ROLE':
                await this.cluster.util.send(message, `❌ You need the role ${humanize.smartJoin(command.detail.map(r => `<@&${r}>`), ', ', ' or ')} in order to use this command!`);
                return true;
            case 'MISSING_PERMISSIONS': {
                const permissions = humanize.permissions(command.detail, true).map(m => `- \`${m}\``);
                await this.cluster.util.send(message, `❌ You need ${p(permissions.length, 'the following permission', 'any of the following permissions')} to use this command:\n${permissions.join('\n')}`);
                return true;
            }
        }
    }
}
