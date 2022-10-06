import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

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

    public getUptime(context: CommandContext): string {
        return this.info(`I came online <t:${context.cluster.createdAt.unix()}:R> at <t:${context.cluster.createdAt.unix()}>`);
    }
}
