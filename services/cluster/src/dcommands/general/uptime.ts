import { CommandType } from '@blargbot/cluster/utils/index.js';

import type { CommandContext} from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

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
