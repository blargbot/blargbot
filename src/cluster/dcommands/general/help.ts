import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

export class HelpCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'help',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Shows a list of all the available commands',
                    execute: (ctx) => ctx.cluster.help.listCommands(ctx.channel, ctx.author, ctx.prefix)
                },
                {
                    parameters: '{commandName} {page:integer=1}',
                    description: 'Shows the help text for the given command',
                    execute: (ctx, [commandName, page]) => ctx.cluster.help.viewCommand(ctx.channel, ctx.author, ctx.prefix, commandName.asString, page.asInteger - 1)
                }
            ]
        }, true);
    }
}
