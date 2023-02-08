import { CommandType } from '@blargbot/cluster/utils/index.js';
import moment from 'moment-timezone';

import type { CommandContext} from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.ping;

export class PingCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'ping',
            category: CommandType.GENERAL,
            description: cmd.description,
            definitions: [
                {
                    parameters: '',
                    execute: ctx => this.ping(ctx),
                    description: cmd.default.description
                }
            ]
        });
    }

    public async ping(context: CommandContext): Promise<CommandResult> {
        const message = await context.reply(cmd.default.pending);
        if (message !== undefined)
            await context.edit(message, cmd.default.success({ ping: moment.duration(message.createdAt - context.timestamp) }));
        return undefined;
    }
}
