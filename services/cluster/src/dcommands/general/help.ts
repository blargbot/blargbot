import { CommandType } from '@blargbot/cluster/utils/index.js';

import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.help;

export class HelpCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'help',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.command.description,
                    execute: (ctx) => ctx.cluster.help.createMessageContent('', ctx.author, ctx.channel)
                },
                {
                    parameters: '{commandName}',
                    description: cmd.list.description,
                    execute: (ctx, [commandName]) => ctx.cluster.help.createMessageContent(commandName.asString, ctx.author, ctx.channel)
                }
            ]
        }, true);
    }
}
