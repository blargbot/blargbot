import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

import { CommandResult } from '../../types';

export class UptimeCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `uptime`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: `Gets how long ive been online for`,
                    execute: (ctx) => this.getUptime(ctx)
                }
            ]
        });
    }

    public getUptime(context: CommandContext): CommandResult {
        return `ℹ️ I came online <t:${context.cluster.createdAt.unix()}:R> at <t:${context.cluster.createdAt.unix()}>`;
    }
}
