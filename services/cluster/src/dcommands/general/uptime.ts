import { CommandContext, GlobalCommand } from '../../command/index';
import { CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

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
