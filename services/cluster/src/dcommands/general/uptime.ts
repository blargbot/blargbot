import { CommandContext, GlobalCommand } from '../../command/index.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';

import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.uptime;

export class UptimeCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'uptime',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: (ctx) => this.getUptime(ctx)
                }
            ]
        });
    }

    public getUptime(context: CommandContext): CommandResult {
        return cmd.default.success({ startTime: context.cluster.createdAt });
    }
}
