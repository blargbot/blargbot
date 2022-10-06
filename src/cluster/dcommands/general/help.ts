import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

export class HelpCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `help`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: `Shows a list of all the available commands`,
                    execute: (ctx) => ctx.cluster.help.createMessageContent(``, ctx.author, ctx.channel)
                },
                {
                    parameters: `{commandName}`,
                    description: `Shows the help text for the given command`,
                    execute: (ctx, [commandName]) => ctx.cluster.help.createMessageContent(commandName.asString, ctx.author, ctx.channel)
                }
            ]
        }, true);
    }
}
